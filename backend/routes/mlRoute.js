const express = require("express")
const { getRecommendations, trainModel } = require("../controllers/mlController.js")

const mlRouter = express.Router();

mlRouter.get("/recommendations", getRecommendations);
mlRouter.post("/train", trainModel);

module.exports = mlRouter;
