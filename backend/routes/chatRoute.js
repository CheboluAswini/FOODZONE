const express = require("express")
const { askChatbot } = require("../controllers/chatController.js")

const chatRouter = express.Router();

chatRouter.post("/ask", askChatbot);

module.exports = chatRouter;