const { GoogleGenerativeAI } = require("@google/generative-ai");
const foodModel = require("../models/foodModel.js");
const orderModel = require("../models/orderModel.js");
const jwt = require("jsonwebtoken");

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askChatbot = async (req, res) => {
    try {
        const { message } = req.body;
        const token = req.headers.token;

        if (!message) {
            return res.status(400).json({ success: false, message: "No message provided" });
        }

        // 1. Fetch Orders Context dynamically if user is logged in
        let userOrdersText = "The user is currently NOT logged in. If they ask about 'my orders' or 'past orders', kindly ask them to log in first to view their personal history.";
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret_key_123");
                const orders = await orderModel.find({ userId: decoded.id }).sort({ date: -1 }).limit(5);
                
                if (orders && orders.length > 0) {
                    userOrdersText = "The user asks about their orders. Here are their most recent orders. Use this data truthfully:\n";
                    orders.forEach((o, index) => {
                        const itemsList = o.items.map(i => `${i.quantity}x ${i.name}`).join(", ");
                        userOrdersText += `Order ${index + 1}: ${itemsList} | Total: $${o.amount} | Status: ${o.status} | Address: ${o.address.city}\n`;
                    });
                } else {
                    userOrdersText = "The user is logged in, but has no past orders yet. Suggest they explore the menu!";
                }
            } catch (err) {
                console.log("Token error in chat", err.message);
            }
        }

        // 2. Fetch Menu Context
        const allFoods = await foodModel.find({}).select("name description price category -_id").limit(30);
        let menuContext = "AVAILABLE MENU ITEMS:\n";
        allFoods.forEach(food => {
            menuContext += `- ${food.name} (${food.category}): $${food.price} - ${food.description}\n`;
        });

        const systemPrompt = `You are a helpful and friendly chatbot for FOODZONE, an online food ordering platform. 
Your goal is to answer customer questions accurately based ONLY on the following context data. Do not hallucinate items or orders.

=== MENU DATA ===
${menuContext}

=== USER'S ACTUAL ORDER HISTORY ===
${userOrdersText}

If the user asks a general question, be conversational. If they ask about orders, use the actual history context above.
User Message: ${message}`;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Generate content
        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        res.json({ success: true, answer: text });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ success: false, message: "Internal server error connecting to AI." });
    }
};

module.exports = { askChatbot };
