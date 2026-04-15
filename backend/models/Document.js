const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  fileUrl: { type: String, required: true }, // path or URL
  fileName: { type: String, required: true },
  fileType: { type: String }, // pdf, doc, etc.
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', documentSchema);