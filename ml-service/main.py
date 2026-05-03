from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os

from dotenv import load_dotenv

from recommender import recommend, train_and_save_model, model_status

load_dotenv()

app = FastAPI(title="FoodZone ML Recommendation Service")


class RecommendationRequest(BaseModel):
    k: int = Field(default=6, ge=1, le=50)


class Recommendation(BaseModel):
    item_id: str
    score: float
    reason: str


def _model_path() -> str:
    return os.getenv("ML_MODEL_PATH", os.path.join("models", "recommender.joblib"))


def _verify_admin_key(x_ml_admin_key: Optional[str]) -> None:
    required = os.getenv("ML_ADMIN_KEY")
    if required and x_ml_admin_key != required:
        raise HTTPException(status_code=401, detail="Invalid ML admin key")


@app.get("/")
def health_check():
    status = model_status(_model_path())
    return {"status": "ok", "service": "ML Service", "model": status}


@app.post("/train")
def train_model(x_ml_admin_key: Optional[str] = Header(default=None)):
    _verify_admin_key(x_ml_admin_key)
    try:
        metrics = train_and_save_model(_model_path())
        return {"success": True, "metrics": metrics}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/recommendations/{user_id}", response_model=List[Recommendation])
def get_recommendations(user_id: str, request: RecommendationRequest):
    result = recommend(user_id, request.k, _model_path())
    return [Recommendation(**rec) for rec in result.get("data", [])]
