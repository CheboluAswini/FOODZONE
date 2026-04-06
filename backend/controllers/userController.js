const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const registerUser = async (req, res) => {
  try {
    console.log('[REGISTER] Incoming registration request');
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('[REGISTER] Missing fields');
      return res.status(400).json({ 
        success: false, 
        message: "Please provide name, email and password" 
      });
    }

    // Check password length
    if (password.length < 6) {
      console.log('[REGISTER] Password too short');
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.log('[REGISTER] User already exists:', email);
      return res.status(409).json({ 
        success: false, 
        message: "User already exists with this email" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('[REGISTER] Password hashed');

    // Create new user
    const newUser = new User({ 
      name, 
      email: email.toLowerCase(), 
      password: hashedPassword,
      role: 'user' // Always create as regular user, admin must be set manually in DB
    });
    
    await newUser.save();
    console.log('[REGISTER] User saved to database:', newUser._id);

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      success: true, 
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
    console.log('[REGISTER] Success - User:', email);
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error registering user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    console.log('[LOGIN] Incoming login request');
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[LOGIN] Missing credentials');
      return res.status(400).json({ 
        success: false, 
        message: "Please provide email and password" 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('[LOGIN] User not found:', email);
      return res.status(404).json({ 
        success: false, 
        message: "User does not exist" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[LOGIN] Invalid password for:', email);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ 
      success: true,
      message: "Login successful", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    console.log('[LOGIN] Success - User:', email, '| Role:', user.role);
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error logging in",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[PROFILE] Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

// Update Profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('[PROFILE] Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

// Add Address
const addAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, country, phone, isDefault } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newAddress = { street, city, state, zipCode, country, phone, isDefault: !!isDefault };

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, message: 'Address added', data: user.addresses });
  } catch (error) {
    console.error('[ADDRESS] Error adding address:', error);
    res.status(500).json({ success: false, message: 'Error adding address' });
  }
};

// Get Addresses
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    console.error('[ADDRESS] Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Error fetching addresses' });
  }
};

// Delete Address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    await user.save();

    res.status(200).json({ success: true, message: 'Address deleted', data: user.addresses });
  } catch (error) {
    console.error('[ADDRESS] Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Error deleting address' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, addAddress, getAddresses, deleteAddress };
