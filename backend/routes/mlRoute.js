const express = require("express")
const { getRecommendations } = require("../controllers/mlController.js")

const mlRouter = express.Router();

mlRouter.get("/recommendations", getRecommendations);

module.exports = mlRouter;