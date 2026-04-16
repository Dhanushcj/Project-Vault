const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'created project', 'updated credential'
  entityType: { type: String, required: true }, // 'project', 'credential', etc.
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityName: { type: String },
  brand: { type: String, required: true, default: 'antigraviity' },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ brand: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);