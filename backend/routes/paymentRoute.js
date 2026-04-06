const express = require('express');
const { processCOD, processCardPayment, processStripe } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All payment routes require authentication
router.post('/cod', authMiddleware, processCOD);
router.post('/card', authMiddleware, processCardPayment);
router.post('/stripe', authMiddleware, processStripe);

module.exports = router;
