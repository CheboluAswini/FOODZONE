const Admin = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    console.log('[ADMIN LOGIN] Incoming login request');
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[ADMIN LOGIN] Missing credentials');
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      console.log('[ADMIN LOGIN] Admin not found:', email);
      return res.status(404).json({
        success: false,
        message: "Admin does not exist"
      });
    }

    // Verify password
    let isMatch = false;
    // Assuming some existing admins migrated may not have bcrypt hashed passwords or just standard bcrypt
    isMatch = await bcrypt.compare(password, admin.password);
    
    // Fallback if the password was not hashed in previous implementation
    if (!isMatch && password === admin.password) {
        isMatch = true; 
        // We could hash and save it here
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        await admin.save();
    }

    if (!isMatch) {
      console.log('[ADMIN LOGIN] Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
    console.log('[ADMIN LOGIN] Success - Admin:', email);
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error logging in admin",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Register Admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all details" });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    const admin = await newAdmin.save();
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, token, message: "Admin created successfully" });
  } catch (error) {
    console.error('[ADMIN REG] Error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { loginAdmin, registerAdmin };