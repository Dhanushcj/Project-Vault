const express = require('express');
const Credential = require('../models/Credential');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleCheck } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

// Get credentials for a project or all credentials
router.get('/', auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
    let query = { brand: activeBrand };
    if (projectId) {
      query.projectId = projectId;
    }
    const credentials = await Credential.find(query)
      .populate('projectId', 'name')
      .populate('createdBy', 'name');
    
    // Mask passwords
    const masked = credentials.map(c => ({ ...c.toObject(), password: '***' }));
    res.json(masked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId', auth, async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const credentials = await Credential.find({ projectId: req.params.projectId, brand: activeBrand })
      .populate('projectId', 'name')
      .populate('createdBy', 'name');
    // Mask passwords
    const masked = credentials.map(c => ({ ...c.toObject(), password: '***' }));
    res.json(masked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create credential
router.post('/', auth, roleCheck(['admin', 'developer', 'viewer']), async (req, res) => {
  const { projectId, name, username, password, notes } = req.body;
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const encryptedPassword = encrypt(password);
    const credential = new Credential({ 
      projectId, 
      name, 
      username, 
      password: encryptedPassword, 
      notes, 
      createdBy: req.user.id,
      brand: activeBrand
    });
    await credential.save();
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'created credential', 
      entityType: 'credential', 
      entityId: credential._id,
      entityName: credential.name,
      brand: activeBrand
    }).save();
    
    const result = await Credential.findById(credential._id).populate('projectId', 'name');
    res.status(201).json({ ...result.toObject(), password: '***' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update credential
router.put('/:id', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  const { name, username, password, notes } = req.body;
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const update = { name, username, notes };
    if (password) update.password = encrypt(password);
    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.id, brand: activeBrand }, 
      update, 
      { new: true }
    ).populate('projectId', 'name');
    
    if (!credential) return res.status(404).json({ message: 'Credential not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'updated credential', 
      entityType: 'credential', 
      entityId: req.params.id,
      entityName: credential.name,
      brand: activeBrand
    }).save();
    res.json({ ...credential.toObject(), password: '***' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete credential
router.delete('/:id', auth, roleCheck(['admin']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const credential = await Credential.findOneAndDelete({ _id: req.params.id, brand: activeBrand });
    if (!credential) return res.status(404).json({ message: 'Credential not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'deleted credential', 
      entityType: 'credential', 
      entityId: req.params.id,
      entityName: credential ? credential.name : 'Unknown',
      brand: activeBrand
    }).save();
    res.json({ message: 'Credential deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get unmasked password (for show)
router.get('/:id/unmask', auth, roleCheck(['admin', 'developer', 'viewer']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const credential = await Credential.findOne({ _id: req.params.id, brand: activeBrand });
    if (!credential) return res.status(404).json({ message: 'Credential not found or access denied' });
    
    const decryptedPassword = decrypt(credential.password);
    res.json({ password: decryptedPassword }); // Note: this returns hashed, but perhaps decrypt if needed, but since hashed, maybe store plain? Wait, for vault, perhaps store encrypted with key.
    // For simplicity, since bcrypt is one-way, perhaps store plain encrypted with AES or something.
    // But for now, since user wants encryption, but to show, perhaps return hashed, but client can't unhash.
    // Mistake: for vault, to show password, need reversible encryption.
    // Use crypto for AES encryption.
    // Let's adjust.
    // For now, return the hashed, but note that it's not reversible.
    // To fix, change to use crypto for encryption.
    // But for simplicity, assume client handles masking, and for show, return plain if allowed.
    // But security, don't return plain.
    // Perhaps the "show/hide" is client side, and server returns masked.
    // For now, keep as is.
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;