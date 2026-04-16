const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  fileUrl: { type: String, required: true }, // path or URL
  fileName: { type: String, required: true },
  fileType: { type: String }, // pdf, doc, etc.
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true, default: 'antigraviity' },
  createdAt: { type: Date, default: Date.now },
});

documentSchema.index({ brand: 1 });

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);