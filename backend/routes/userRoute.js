const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  addAddress,
  getAddresses,
  deleteAddress
} = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// User registration and login routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Profile routes
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

// Address routes
router.get('/address', authMiddleware, getAddresses);
router.post('/address', authMiddleware, addAddress);
router.delete('/address/:addressId', authMiddleware, deleteAddress);

module.exports = router;
