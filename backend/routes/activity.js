const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get activity logs
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 50, entityType, action } = req.query;
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const query = { brand: activeBrand };
  if (entityType && entityType !== 'all') {
    query.entityType = entityType;
  }
  
  if (action) {
    query.action = { $regex: action, $options: 'i' };
  }

  try {
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;