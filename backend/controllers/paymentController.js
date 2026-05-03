const Order = require('../models/orderModel');
const crypto = require('crypto');

// Cash on Delivery Payment
const processCOD = async (req, res) => {
  try {
    console.log('[PAYMENT] Processing COD payment');
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID is required" 
      });
    }

    // Find order and verify it belongs to the user
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      console.log('[PAYMENT] Order not found:', orderId);
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Update order with payment method
    order.payment = {
      method: 'Cash on Delivery',
      status: 'pending',
      paidAt: null
    };
    order.status = 'processing';

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: "Order confirmed. Pay on delivery",
      data: order
    });
    console.log('[PAYMENT] COD payment set for order:', orderId);
  } catch (error) {
    console.error('[PAYMENT] COD error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing payment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Card/UPI Payment (Generic)
const processCardPayment = async (req, res) => {
  try {
    console.log('[PAYMENT] Processing Card/UPI payment');
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and payment method are required" 
      });
    }

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      console.log('[PAYMENT] Order not found:', orderId);
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // In production, integrate with real payment gateway here
    order.payment = {
      method: paymentMethod,
      status: 'completed',
      paidAt: new Date()
    };
    order.status = 'processing';

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: "Payment successful",
      data: order
    });
    console.log('[PAYMENT] Payment completed for order:', orderId);
  } catch (error) {
    console.error('[PAYMENT] Card payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing payment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Stripe Payment (Optional - requires stripe package)
const processStripe = async (req, res) => {
  try {
    console.log('[PAYMENT] Processing Stripe payment');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: "Stripe is not configured" 
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { orderId, amount } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'FOODZONE Order',
            description: `Order ID: ${orderId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CORS_ORIGIN}/myorders?payment=success`,
      cancel_url: `${process.env.CORS_ORIGIN}/payment?payment=cancelled`,
      metadata: { orderId: orderId.toString(), userId: userId.toString() }
    });

    order.payment = {
      method: 'Stripe',
      status: 'pending',
      stripeSessionId: session.id
    };
    await order.save();

    res.status(200).json({ 
      success: true, 
      sessionUrl: session.url,
      sessionId: session.id
    });
    console.log('[PAYMENT] Stripe session created:', session.id);
  } catch (error) {
    console.error('[PAYMENT] Stripe error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating Stripe session",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Stripe Webhook Endpoint
const stripeWebhook = async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret) {
      const signature = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error(`[PAYMENT] Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    const userId = session.metadata.userId;

    try {
      const order = await Order.findOne({ _id: orderId, userId });
      if (order && order.payment.status !== 'completed') {
        order.payment.status = 'completed';
        order.payment.paidAt = new Date();
        order.status = 'processing';
        await order.save();
        console.log(`[PAYMENT] Webhook fulfilled payment for order: ${orderId}`);
      }
    } catch (err) {
      console.error(`[PAYMENT] Webhook processing error: ${err.message}`);
    }
  }

  res.send('null').status(200);
};

module.exports = { 
  processCOD, 
  processCardPayment,
  processStripe,
  stripeWebhook
};
