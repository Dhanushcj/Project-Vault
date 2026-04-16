const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  videoUrl: { type: String, required: true }, // YouTube, Loom, etc.
  title: { type: String },
  description: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true, default: 'antigraviity' },
  createdAt: { type: Date, default: Date.now },
});

videoSchema.index({ brand: 1 });

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema);