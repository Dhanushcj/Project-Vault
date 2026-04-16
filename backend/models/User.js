const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'developer', 'viewer'], default: 'viewer' },
  name: { type: String, required: true },
  mobileNumber: { type: String },
  brand: { type: String, required: true, default: 'antigraviity' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ brand: 1 });

module.exports = mongoose.model('User', userSchema);