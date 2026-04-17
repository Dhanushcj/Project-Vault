const express = require('express');
const path = require('path');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleCheck } = require('../middleware/auth');
const { uploadDocument } = require('../lib/cloudinary');

const router = express.Router();


// Get documents for a project or all documents
router.get('/', auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
    if (projectId) {
      const documents = await Document.find({ projectId, brand: activeBrand }).populate('uploadedBy', 'name');
      return res.json(documents);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId', auth, async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const documents = await Document.find({ projectId: req.params.projectId, brand: activeBrand }).populate('uploadedBy', 'name');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, roleCheck(['admin', 'developer']), uploadDocument.single('file'), async (req, res) => {
  try {
    const { projectId, fileName, fileUrl: providedUrl, fileType: providedType } = req.body;
    const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
    
    // Determine the file URL: either from multer (local/cloudinary storage) or provided directly (client-side upload)
    const fileUrl = req.file ? req.file.path : providedUrl;
    
    if (!fileUrl) {
      return res.status(400).json({ message: 'No file uploaded or URL provided' });
    }

    const document = new Document({ 
      projectId, 
      fileUrl, 
      fileName: fileName || (req.file ? req.file.originalname : 'Uploaded Document'), 
      fileType: providedType || (req.file ? path.extname(req.file.originalname) : '.dat'), 
      uploadedBy: req.user.id,
      brand: activeBrand
    });
    
    await document.save();


    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'uploaded document', 
      entityType: 'document', 
      entityId: document._id,
      entityName: document.fileName,
      brand: activeBrand
    }).save();
    res.status(201).json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update document (perhaps rename)
router.put('/:id', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const document = await Document.findOneAndUpdate({ _id: req.params.id, brand: activeBrand }, req.body, { new: true });
    if (!document) return res.status(404).json({ message: 'Document not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'updated document', 
      entityType: 'document', 
      entityId: req.params.id,
      entityName: document.fileName,
      brand: activeBrand
    }).save();
    res.json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete document
router.delete('/:id', auth, roleCheck(['admin']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, brand: activeBrand });
    if (!document) return res.status(404).json({ message: 'Document not found or access denied' });
    
    // Optionally delete file from disk
    // fs.unlinkSync(document.fileUrl);
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'deleted document', 
      entityType: 'document', 
      entityId: req.params.id,
      entityName: document.fileName,
      brand: activeBrand
    }).save();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;