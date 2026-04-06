const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Salad', 'Rice', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles']
  },
  stock: {
    type: Number,
    default: 100,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
foodSchema.index({ category: 1 });
foodSchema.index({ available: 1 });
foodSchema.index({ name: 'text', description: 'text' });

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
