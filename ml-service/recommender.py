from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from urllib.parse import urlparse

import joblib
import numpy as np
import scipy.sparse as sp
from implicit.als import AlternatingLeastSquares
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

MODEL_VERSION = "als-tfidf-hybrid-v2"

@dataclass
class RecommenderArtifacts:
    model: AlternatingLeastSquares
    user_id_map: Dict[str, int]
    item_id_map: Dict[str, int]
    index_to_item_id: List[str]
    user_items: sp.csr_matrix
    item_popularity: np.ndarray
    item_categories: Dict[str, str]
    user_top_categories: Dict[str, List[str]]
    trained_at: str
    model_version: str
    tfidf_matrix: sp.csr_matrix = None
    tfidf_vectorizer: TfidfVectorizer = None



_CACHE = {"path": None, "mtime": None, "artifacts": None}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_db_name(uri: str) -> str:
    parsed = urlparse(uri)
    if parsed.path and parsed.path != "/":
        return parsed.path.lstrip("/")
    return "test"


def _get_db() -> Tuple[MongoClient, object]:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/foodzone")
    client = MongoClient(mongo_uri)
    db_name = _parse_db_name(mongo_uri)
    return client, client[db_name]


def _load_foods(db) -> Tuple[List[str], Dict[str, str], List[str]]:
    foods = list(db.foods.find({}, {"_id": 1, "category": 1, "name": 1, "description": 1}))
    item_ids = [str(f["_id"]) for f in foods]
    item_categories = {str(f["_id"]): f.get("category", "") for f in foods}
    item_texts = [f"{f.get('name', '')} {f.get('category', '')} {f.get('description', '')}" for f in foods]
    return item_ids, item_categories, item_texts


def _load_orders(db):
    return list(db.orders.find({}, {"userId": 1, "items": 1}))


def _build_interactions(
    orders, item_id_set: set, item_categories: Dict[str, str]
) -> Tuple[Dict[Tuple[str, str], float], Dict[str, Dict[str, float]]]:
    interactions: Dict[Tuple[str, str], float] = {}
    user_category_counts: Dict[str, Dict[str, float]] = {}

    for order in orders:
        user_id = str(order.get("userId"))
        if not user_id:
            continue
        items = order.get("items") or []
        for item in items:
            food_id = str(item.get("foodId"))
            if not food_id or food_id not in item_id_set:
                continue
            quantity = float(item.get("quantity") or 1)
            key = (user_id, food_id)
            interactions[key] = interactions.get(key, 0.0) + quantity

            category = item_categories.get(food_id)
            if category:
                if user_id not in user_category_counts:
                    user_category_counts[user_id] = {}
                user_category_counts[user_id][category] = (
                    user_category_counts[user_id].get(category, 0.0) + quantity
                )

    return interactions, user_category_counts


def _top_categories(counts: Dict[str, Dict[str, float]]) -> Dict[str, List[str]]:
    top_map: Dict[str, List[str]] = {}
    for user_id, cat_counts in counts.items():
        ranked = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
        top_map[user_id] = [c for c, _ in ranked[:3]]
    return top_map


def train_and_save_model(model_path: str) -> Dict[str, object]:
    client, db = _get_db()
    try:
        item_ids, item_categories, item_texts = _load_foods(db)
        orders = _load_orders(db)

        if not item_ids:
            raise ValueError("No food items found to train on.")

        # Train TF-IDF for pure Content-Based/Hybrid capabilities
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(item_texts)

        interactions, user_category_counts = _build_interactions(
            orders, set(item_ids), item_categories
        )

        if not interactions:
            raise ValueError("Not enough interaction data to train.")

        user_ids = sorted({user_id for user_id, _ in interactions.keys()})
        user_id_map = {user_id: idx for idx, user_id in enumerate(user_ids)}
        item_id_map = {item_id: idx for idx, item_id in enumerate(item_ids)}

        rows, cols, data = [], [], []
        for (user_id, item_id), count in interactions.items():
            rows.append(user_id_map[user_id])
            cols.append(item_id_map[item_id])
            data.append(count)

        user_items = sp.csr_matrix(
            (np.array(data, dtype=np.float32), (rows, cols)),
            shape=(len(user_ids), len(item_ids)),
        )

        if user_items.nnz == 0 or user_items.shape[0] < 2 or user_items.shape[1] < 2:
            raise ValueError("Not enough data to train a stable model.")

        item_user = user_items.T.tocsr()
        model = AlternatingLeastSquares(
            factors=64, iterations=20, regularization=0.02, random_state=42
        )
        model.fit(item_user)

        item_popularity = np.asarray(user_items.sum(axis=0)).reshape(-1)
        artifacts = RecommenderArtifacts(
            model=model,
            user_id_map=user_id_map,
            item_id_map=item_id_map,
            index_to_item_id=item_ids,
            user_items=user_items,
            item_popularity=item_popularity,
            item_categories=item_categories,
            user_top_categories=_top_categories(user_category_counts),
            trained_at=_utc_now(),
            model_version=MODEL_VERSION,
            tfidf_matrix=tfidf_matrix,
            tfidf_vectorizer=tfidf
        )

        model_path = os.path.abspath(model_path)
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(artifacts, model_path)
        _update_cache(model_path, artifacts)

        return {
            "model_version": artifacts.model_version,
            "trained_at": artifacts.trained_at,
            "users": len(user_ids),
            "items": len(item_ids),
            "interactions": int(user_items.nnz),
        }
    finally:
        client.close()


def _update_cache(model_path: str, artifacts: RecommenderArtifacts) -> None:
    _CACHE["path"] = model_path
    _CACHE["mtime"] = os.path.getmtime(model_path)
    _CACHE["artifacts"] = artifacts


def _load_cached(model_path: str):
    model_path = os.path.abspath(model_path)
    if not os.path.exists(model_path):
        return None
    mtime = os.path.getmtime(model_path)
    if _CACHE["path"] == model_path and _CACHE["mtime"] == mtime:
        return _CACHE["artifacts"]
    artifacts = joblib.load(model_path)
    _update_cache(model_path, artifacts)
    return artifacts


def _popular_from_db(db, k: int) -> List[Tuple[str, float]]:
    pipeline = [
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.foodId",
                "count": {"$sum": "$items.quantity"},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": k},
    ]
    results = list(db.orders.aggregate(pipeline))
    return [(str(r["_id"]), float(r["count"])) for r in results if r.get("_id")]


def recommend(user_id: str, k: int, model_path: str) -> Dict[str, object]:
    user_id = user_id or "anonymous"
    artifacts = _load_cached(model_path)

    if artifacts:
        # Check if the user is known for Collaborative Filtering
        if user_id in artifacts.user_id_map.keys():
            user_index = artifacts.user_id_map[user_id]
            ids, als_scores = artifacts.model.recommend(
                user_index,
                artifacts.user_items,
                N=k,
                filter_already_liked_items=False,
            )
            item_ids = [artifacts.index_to_item_id[i] for i in ids]
            norm_scores = _normalize_scores(list(als_scores))
            
            # Incorporate Hybrid Scoring (ALS + Popularity Boost for items in their top categories)
            for i, iid in enumerate(item_ids):
                cat = artifacts.item_categories.get(iid)
                if cat and cat in artifacts.user_top_categories.get(user_id, []):
                    norm_scores[i] = min(1.0, norm_scores[i] + 0.15) # Content/Category boost

            reasons = _build_reasons(
                user_id, item_ids, artifacts.item_categories, artifacts.user_top_categories
            )
            return {
                "source": "hybrid-model",
                "model_version": artifacts.model_version,
                "trained_at": artifacts.trained_at,
                "data": [
                    {"item_id": item_id, "score": float(score), "reason": reason}
                    for item_id, score, reason in zip(item_ids, norm_scores, reasons)
                ],
            }

        # Cold Start or Anonymous: Use purely Content-Based + Popularity Hybrid
        popular_ids = _popular_from_artifacts(artifacts, k * 2)
        if hasattr(artifacts, 'tfidf_matrix') and artifacts.tfidf_matrix is not None and popular_ids:
            # Just serve the top diverse/popular items as baseline
            final_ids = popular_ids[:k]
            reasons = ["Trending hot item" for _ in final_ids]
            popular_scores = _normalize_scores(_popular_scores(artifacts, final_ids))
            return {
                "source": "content-popular",
                "model_version": artifacts.model_version,
                "trained_at": artifacts.trained_at,
                "data": [
                    {"item_id": item_id, "score": float(score), "reason": reason}
                    for item_id, score, reason in zip(final_ids, popular_scores, reasons)
                ],
            }
        
        # Fallback if TFIDF isn't trained yet
        popular_ids = _popular_from_artifacts(artifacts, k)
        reasons = ["Popular right now" for _ in popular_ids]
        popular_scores = _normalize_scores(_popular_scores(artifacts, popular_ids))
        return {
            "source": "popular",
            "model_version": artifacts.model_version,
            "trained_at": artifacts.trained_at,
            "data": [
                {"item_id": item_id, "score": float(score), "reason": reason}
                for item_id, score, reason in zip(popular_ids, popular_scores, reasons)
            ],
        }

    client, db = _get_db()
    try:
        popular = _popular_from_db(db, k)
        popular_scores = _normalize_scores([score for _, score in popular])
        return {
            "source": "popular-db",
            "model_version": None,
            "trained_at": None,
            "data": [
                {"item_id": item_id, "score": float(norm_score), "reason": "Popular right now"}
                for (item_id, _raw_score), norm_score in zip(popular, popular_scores)
            ],
        }
    finally:
        client.close()


def _popular_from_artifacts(artifacts: RecommenderArtifacts, k: int) -> List[str]:
    if artifacts.item_popularity.size == 0:
        return []
    ranked = np.argsort(-artifacts.item_popularity)[:k]
    return [artifacts.index_to_item_id[i] for i in ranked if i < len(artifacts.index_to_item_id)]


def _popular_scores(artifacts: RecommenderArtifacts, item_ids: List[str]) -> List[float]:
    scores = []
    for item_id in item_ids:
        idx = artifacts.item_id_map.get(item_id)
        scores.append(float(artifacts.item_popularity[idx]) if idx is not None else 0.0)
    return scores


def _build_reasons(
    user_id: str,
    item_ids: List[str],
    item_categories: Dict[str, str],
    user_top_categories: Dict[str, List[str]],
) -> List[str]:
    top_categories = set(user_top_categories.get(user_id, []))
    reasons = []
    for item_id in item_ids:
        category = item_categories.get(item_id)
        if category and category in top_categories:
            reasons.append(f"Because you order {category} often")
        else:
            reasons.append("Popular right now")
    return reasons


def _normalize_scores(scores: List[float]) -> List[float]:
    if not scores:
        return []
    min_score = float(np.min(scores))
    max_score = float(np.max(scores))
    if max_score == min_score:
        return [0.8 for _ in scores]
    return [float((s - min_score) / (max_score - min_score)) for s in scores]


def model_status(model_path: str) -> Dict[str, object]:
    artifacts = _load_cached(model_path)
    if not artifacts:
        return {"loaded": False, "model_version": None, "trained_at": None}
    return {
        "loaded": True,
        "model_version": artifacts.model_version,
        "trained_at": artifacts.trained_at,
    }
