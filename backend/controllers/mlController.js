const axios = require('axios');
const foodModel = require('../models/foodModel.js');
const orderModel = require('../models/orderModel.js');
const jwt = require('jsonwebtoken');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const getRecommendations = async (req, res) => {
    try {
        const token = req.headers.token;
        let userId = null;
        let pastCategories = [];

        // 1. Get User's Past Categories 
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret_key_123");
                userId = decoded.id;
                const orders = await orderModel.find({ userId }).sort({ date: -1 }).limit(10);
                
                // Extract categories they frequently order
                const catCounts = {};
                orders.forEach(o => {
                    o.items.forEach(i => {
                        catCounts[i.category] = (catCounts[i.category] || 0) + 1;
                    });
                });
                // Sort by frequency
                pastCategories = Object.keys(catCounts).sort((a,b) => catCounts[b] - catCounts[a]);
            } catch(e) { }
        }

        // 2. Map Time to highly relevant categories
        const hour = new Date().getHours();
        let timeStr = "";
        let timeCategories = [];

        if (hour >= 6 && hour < 12) {
            timeStr = "morning";
            timeCategories = ["Sandwich", "Salad", "Pure Veg", "Bread", "Breakfast"];
        } else if (hour >= 12 && hour < 16) {
            timeStr = "afternoon";
            timeCategories = ["Biryani", "Rice", "Pure Veg", "Noodles", "Pasta"]; // heavy meals
        } else if (hour >= 16 && hour < 20) {
            timeStr = "evening";
            timeCategories = ["Cake", "Deserts", "Salad", "Rolls", "Snacks"];
        } else {
            timeStr = "night";
            timeCategories = ["Biryani", "Salad", "Pasta", "Noodles", "Deserts", "Tiffin"];
        }

        // 3. Fetch all foods and assign ML threshold scores
        const foods = await foodModel.find({});
        const scoredFoods = [];

        foods.forEach(food => {
            let score = 0.50; // Base score
            let reason = "Popular near you";

            // If it matches the time of day, huge jump
            if (timeCategories.includes(food.category)) {
                score += 0.35; // 0.85+
                reason = `Perfect for ${timeStr}`;
            }

            // If it matches past history, further increase
            if (pastCategories.includes(food.category)) {
                score += 0.12; 
                reason = `Since you love ${food.category} & great for ${timeStr}`;
            }

            // Make sure max is 0.99
            if (score > 0.99) score = 0.99;

            // Only push if threshold >= 0.85!
            if (score >= 0.85) {
                scoredFoods.push({
                    ...food._doc,
                    ml_score: score,
                    ml_reason: reason
                });
            }
        });

        // 4. Sort by score descending
        scoredFoods.sort((a,b) => b.ml_score - a.ml_score);

        // Return top 6 items
        res.json({ success: true, data: scoredFoods.slice(0, 6) });
    } catch (error) {
        console.error("ML Service Error:", error.message);
        res.json({ success: false, message: "ML Core failed", data: [] });
    }
};

module.exports = { getRecommendations };