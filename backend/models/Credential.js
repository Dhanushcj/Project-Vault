const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // encrypted
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true, default: 'antigraviity' },
  createdAt: { type: Date, default: Date.now },
});

// Add index for performance
credentialSchema.index({ projectId: 1 });
credentialSchema.index({ brand: 1 });

module.exports = mongoose.model('Credential', credentialSchema);