const express = require('express');
const { placeOrder, getUserOrders, listOrders, updateOrderStatus, trackOrder } = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminAuth');

const router = express.Router();

// User routes (protected)
router.post('/place', authMiddleware, placeOrder);
router.get('/userorders', authMiddleware, getUserOrders);
router.post('/track', authMiddleware, trackOrder);

// Admin routes (protected - requires authentication AND admin role)
router.get('/list', authMiddleware, adminMiddleware, listOrders);
router.post('/status', authMiddleware, adminMiddleware, updateOrderStatus);

module.exports = router;
