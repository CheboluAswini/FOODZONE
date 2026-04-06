const Order = require('../models/orderModel');
const nodemailer = require('nodemailer');

// Place Order
const placeOrder = async (req, res) => {
  try {
    console.log('[ORDER] Placing new order');
    const { items, amount, address } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !amount || !address) {
      console.log('[ORDER] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: items, amount, address" 
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.log('[ORDER] Invalid items array');
      return res.status(400).json({ 
        success: false, 
        message: "Order must contain at least one item" 
      });
    }

    const newOrder = new Order({
      userId,
      items,
      amount,
      address,
      status: 'pending'
    });

    await newOrder.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Order placed successfully",
      orderId: newOrder._id,
      data: newOrder
    });
    console.log('[ORDER] Order created:', newOrder._id);
  } catch (error) {
    console.error('[ORDER] Error placing order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error placing order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get User Orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[ORDER] Fetching orders for user:', userId);

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: orders.length,
      data: orders 
    });
    console.log(`[ORDER] Found ${orders.length} orders for user:`, userId);
  } catch (error) {
    console.error('[ORDER] Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching orders",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all orders (Admin only)
const listOrders = async (req, res) => {
  try {
    console.log('[ORDER] Admin fetching all orders');
    const mongoose = require('mongoose');
    const { page = 1, limit = 10, status, orderId } = req.query;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        query._id = orderId;
      }
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.status(200).json({ 
      success: true,
      data: orders,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalOrders: count
    });
    console.log(`[ORDER] Admin fetched ${orders.length} orders`);
  } catch (error) {
    console.error('[ORDER] Error listing orders:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching orders",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    console.log('[ORDER] Updating order status:', orderId, '->', status);

    if (!orderId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and status are required" 
      });
    }

    const validStatuses = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        ...(status === 'delivered' && { 'deliveryDetails.actualDeliveryTime': new Date() })
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!order) {
      console.log('[ORDER] Order not found:', orderId);
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && order.userId?.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
        });
        await transporter.sendMail({
          from: process.env.SMTP_EMAIL,
          to: order.userId.email,
          subject: `FOODZONE: Order Status Update - ${orderId}`,
          text: `Hello ${order.userId.name || 'Customer'},\n\nYour order (${orderId}) status has been updated to: ${status.toUpperCase()}.\n\nThank you for shopping with FOODZONE!`
        });
        console.log('[ORDER] Status email sent to:', order.userId.email);
      } catch (mailError) {
        console.error('[ORDER] Failed to send status email:', mailError.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Order status updated successfully",
      data: order
    });
    console.log('[ORDER] Order status updated:', orderId);
  } catch (error) {
    console.error('[ORDER] Error updating order:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating order status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const trackOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('[ORDER] Error tracking order:', error);
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
};

module.exports = { placeOrder, getUserOrders, listOrders, updateOrderStatus, trackOrder };
