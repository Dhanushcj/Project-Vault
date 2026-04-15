const express = require('express');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleCheck } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().populate('assignedTeam', 'name').populate('createdBy', 'name');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create project
router.post('/', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  const project = new Project({ ...req.body, createdBy: req.user.id });
  try {
    await project.save();
    await new ActivityLog({ userId: req.user.id, action: 'created project', entityType: 'project', entityId: project._id }).save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update project
router.put('/:id', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    await new ActivityLog({ userId: req.user.id, action: 'updated project', entityType: 'project', entityId: req.params.id }).save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete project
router.delete('/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await new ActivityLog({ userId: req.user.id, action: 'deleted project', entityType: 'project', entityId: req.params.id }).save();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;