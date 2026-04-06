const Admin = require('../models/adminModel');

// Middleware to verify admin role
const adminMiddleware = async (req, res, next) => {
  try {
    // First check if user is authenticated (this should run after authMiddleware)
    if (!req.user || !req.user.id) {
      console.log('[ADMIN] No user in request');
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Fetch user from database to verify current role
    const admin = await Admin.findById(req.user.id).select('role email');

    if (!admin) {
      console.log('[ADMIN] Admin not found:', req.user.id);
      return res.status(404).json({
        success: false, 
        message: "Admin not found"
      });
    }

    // Check if user has admin role
    if (admin.role !== 'admin') {
      console.log('[ADMIN] Access denied for user:', admin.email);
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    console.log('[ADMIN] Admin access granted:', admin.email);
    // User is admin, proceed
    next();
  } catch (error) {
    console.log('[ADMIN] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error verifying admin privileges",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = adminMiddleware;
