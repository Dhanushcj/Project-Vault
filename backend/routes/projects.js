const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleCheck } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const [totalProjects, activeProjects, totalUsers, totalDocuments] = await Promise.all([
      Project.countDocuments({ brand: activeBrand, isDeleted: { $ne: true } }),
      Project.countDocuments({ brand: activeBrand, status: 'active', isDeleted: { $ne: true } }),
      User.countDocuments({ brand: activeBrand }),
      Document.countDocuments({ brand: activeBrand })
    ]);

    res.json({
      totalProjects,
      activeProjects,
      totalUsers,
      totalDocuments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all projects
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 20, status, name, includeDeleted } = req.query;
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { brand: activeBrand };
  
  // Hard filter for non-admins to NEVER see deleted projects
  // Admins can see them if includeDeleted is true
  if (req.user.role !== 'admin' || includeDeleted !== 'true') {
    query.isDeleted = { $ne: true };
  }

  if (status && status !== 'all') {
    query.status = status;
  }
  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }
  if (req.query.techStack) {
    query.techStack = { $regex: req.query.techStack, $options: 'i' };
  }

  try {
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('assignedTeam.user', 'name role')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    res.json({
      projects,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project
router.post('/', auth, roleCheck(['admin', 'developer', 'viewer']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  const project = new Project({ 
    ...req.body, 
    createdBy: req.user.id,
    brand: activeBrand
  });
  try {
    await project.save();
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'created project', 
      entityType: 'project', 
      entityId: project._id,
      entityName: project.name,
      brand: activeBrand
    }).save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const project = await Project.findOne({ _id: req.params.id, brand: activeBrand })
      .populate('assignedTeam.user', 'name role')
      .populate('createdBy', 'name');
    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update project
router.put('/:id', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, brand: activeBrand }, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'updated project', 
      entityType: 'project', 
      entityId: req.params.id, 
      entityName: project.name,
      brand: activeBrand
    }).save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete project (Soft Delete)
router.delete('/:id', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, brand: activeBrand }, 
      { 
        isDeleted: true, 
        deletedAt: Date.now(),
        deletedBy: req.user.id 
      }, 
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'deleted project', 
      entityType: 'project', 
      entityId: req.params.id,
      entityName: project.name,
      brand: activeBrand
    }).save();
    res.json({ message: 'Project moved to trash', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Restore project (Admin only)
router.post('/:id/restore', auth, roleCheck(['admin']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, brand: activeBrand },
      { isDeleted: false, $unset: { deletedAt: 1, deletedBy: 1 } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'restored project', 
      entityType: 'project', 
      entityId: req.params.id,
      entityName: project.name,
      brand: activeBrand
    }).save();
    res.json({ message: 'Project restored', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Permanent delete (Admin only)
router.delete('/:id/permanent', auth, roleCheck(['admin']), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await new ActivityLog({ userId: req.user.id, action: 'permanently deleted project', entityType: 'project', entityId: req.params.id }).save();
    res.json({ message: 'Project permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;