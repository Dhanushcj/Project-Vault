const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  techStack: [{ type: String }],
  status: { type: String, enum: ['active', 'completed', 'maintenance'], default: 'active' },
  assignedTeam: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    projectRole: { type: String, default: 'Developer' }
  }],
  githubUrl: { type: String },
  liveUrl: { type: String },
  stagingUrl: { type: String },
  apiEndpoints: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true, default: 'antigraviity' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes for performance
projectSchema.index({ createdAt: -1 });
projectSchema.index({ status: 1 });
projectSchema.index({ brand: 1 });

module.exports = mongoose.model('Project', projectSchema);