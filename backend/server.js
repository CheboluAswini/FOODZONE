const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('='.repeat(60));
console.log('[STARTING] FOODZONE Backend Server Starting...');
console.log('='.repeat(60));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Allow all CORS requests for now to fix issues

// Database Connection
if (!process.env.MONGODB_URI) {
    console.error('[ERROR] MONGODB_URI is missing from env variables');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('[SUCCESS] MongoDB Connected'))
  .catch((err) => {
    console.error('[ERROR] MongoDB Connection Error:', err);
    process.exit(1);
  });

// Static files for images
app.use('/images', express.static('uploads'));

// Routes
console.log('[INIT] Loading routes...');
const userRouter = require('./routes/userRoute');
const foodRouter = require('./routes/foodRoute');
const orderRouter = require('./routes/orderRoute');
const chatRouter = require('./routes/chatRoute');
const mlRouter = require('./routes/mlRoute');
let paymentRouter;
try {
    paymentRouter = require('./routes/paymentRoute');
} catch (e) {}

app.use('/api/user', userRouter);
app.use('/api/food', foodRouter);
app.use('/api/order', orderRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ml', mlRouter);
if (paymentRouter) app.use('/api/payment', paymentRouter);

// Temporary fix if adminRoute doesn't exist separately
try {
    const adminRouter = require('./routes/adminRoute');
    app.use('/api/admin', adminRouter);
    console.log('   - /api/admin');
} catch (e) {
    console.log('   - Admin route not found directly, falling back to adding /login mock');
    // If adminRoute isn't there but frontend calls /api/admin/login
    app.post('/api/admin/login', (req, res) => {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
            return res.json({ success: true, token });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
}


console.log('[SUCCESS] Routes loaded');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'FOODZONE API Server',
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log('='.repeat(60));
});
