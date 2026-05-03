const express = require('express');
const { processCOD, processCardPayment, processStripe, stripeWebhook } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Webhook route (needs raw body, so no authMiddleware and it must be processed correctly in server.js)
router.post('/webhook', stripeWebhook);

// All payment routes require authentication
router.post('/cod', authMiddleware, processCOD);
router.post('/card', authMiddleware, processCardPayment);
router.post('/stripe', authMiddleware, processStripe);

module.exports = router;
