const axios = require('axios');
const foodModel = require('../models/foodModel.js');
const orderModel = require('../models/orderModel.js');
const jwt = require('jsonwebtoken');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_ADMIN_KEY = process.env.ML_ADMIN_KEY || '';

const getRecommendations = async (req, res) => {
    try {
        const token = req.headers.token;
        let userId = 'anonymous';

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret_key_123");
                userId = decoded.id;
            } catch (e) {
                userId = 'anonymous';
            }
        }

        let mlResponse = null;
        try {
            mlResponse = await axios.post(
                `${ML_SERVICE_URL}/recommendations/${userId}`,
                { k: 6 },
                {
                    timeout: 5000,
                    headers: ML_ADMIN_KEY ? { 'x-ml-admin-key': ML_ADMIN_KEY } : {}
                }
            );
        } catch (error) {
            console.error("[ML] Recommendation fetch failed:", error.message);
        }

        if (mlResponse && Array.isArray(mlResponse.data) && mlResponse.data.length > 0) {
            const rankedItems = mlResponse.data;
            const itemIds = rankedItems.map(r => r.item_id);
            const foods = await foodModel.find({
                _id: { $in: itemIds },
                available: true,
                stock: { $gt: 0 }
            });
            const foodMap = new Map(foods.map(food => [food._id.toString(), food]));

            const enriched = rankedItems.map(rec => {
                const food = foodMap.get(rec.item_id);
                if (!food) return null;
                return {
                    ...food._doc,
                    ml_score: rec.score,
                    ml_reason: rec.reason
                };
            }).filter(Boolean);

            return res.json({ success: true, data: enriched });
        }

        const fallback = await buildPopularFallback(6);
        res.json({ success: true, data: fallback });
    } catch (error) {
        console.error("ML Service Error:", error.message);
        res.json({ success: false, message: "ML Core failed", data: [] });
    }
};

const buildPopularFallback = async (limit) => {
    const pipeline = [
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.foodId",
                count: { $sum: "$items.quantity" }
            }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
    ];

    const popular = await orderModel.aggregate(pipeline);
    if (!popular.length) return [];

    const maxCount = Math.max(...popular.map(p => p.count || 0), 1);
    const ids = popular.map(p => p._id);
    const foods = await foodModel.find({
        _id: { $in: ids },
        available: true,
        stock: { $gt: 0 }
    });
    const foodMap = new Map(foods.map(food => [food._id.toString(), food]));

    return popular.map(p => {
        const food = foodMap.get(String(p._id));
        if (!food) return null;
        return {
            ...food._doc,
            ml_score: (p.count || 0) / maxCount,
            ml_reason: "Popular right now"
        };
    }).filter(Boolean);
};

const trainModel = async (req, res) => {
    try {
        const providedKey = req.headers['x-ml-admin-key'];
        if (ML_ADMIN_KEY && providedKey !== ML_ADMIN_KEY) {
            return res.status(401).json({ success: false, message: "Invalid ML admin key" });
        }

        const response = await axios.post(
            `${ML_SERVICE_URL}/train`,
            {},
            {
                timeout: 120000,
                headers: ML_ADMIN_KEY ? { 'x-ml-admin-key': ML_ADMIN_KEY } : {}
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error("[ML] Training failed:", error.message);
        res.status(500).json({ success: false, message: "ML training failed" });
    }
};

module.exports = { getRecommendations, trainModel };
