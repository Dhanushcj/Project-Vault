const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  techStack: [{ type: String }],
  status: { type: String, enum: ['active', 'completed', 'maintenance'], default: 'active' },
  assignedTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  githubUrl: { type: String },
  liveUrl: { type: String },
  stagingUrl: { type: String },
  apiEndpoints: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);