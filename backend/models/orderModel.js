const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    foodId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    zipcode: String,
    country: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['Cash on Delivery', 'Stripe', 'Razorpay', 'Card', 'UPI'],
      default: 'Cash on Delivery'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paidAt: Date,
    stripeSessionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String
  },
  deliveryDetails: {
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date
  }
}, {
  timestamps: true
});

// Create indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
