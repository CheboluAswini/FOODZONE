const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

const adminDb = mongoose.connection.useDb('admin_data', { useCache: true });
const Admin = adminDb.model('Admin', adminSchema);

module.exports = Admin;
