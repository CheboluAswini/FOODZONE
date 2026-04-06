const express = require('express');
const { getAllFoods, addFood, removeFood, updateFood } = require('../controllers/foodController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Public routes
router.get('/list', getAllFoods);

// Admin routes (protected - requires authentication AND admin role)
router.post('/add', authMiddleware, adminMiddleware, upload.single('image'), addFood);
router.post('/remove', authMiddleware, adminMiddleware, removeFood);
router.put('/update', authMiddleware, adminMiddleware, updateFood);

module.exports = router;
