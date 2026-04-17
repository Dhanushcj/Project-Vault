const express = require('express');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleCheck } = require('../middleware/auth');
const { uploadVideo } = require('../lib/cloudinary');

const router = express.Router();


// Get videos for a project or all videos
router.get('/', auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
    if (projectId) {
      const videos = await Video.find({ projectId, brand: activeBrand }).populate('uploadedBy', 'name');
      return res.json(videos);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId', auth, async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const videos = await Video.find({ projectId: req.params.projectId, brand: activeBrand }).populate('uploadedBy', 'name');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create video
router.post('/', auth, roleCheck(['admin', 'developer', 'viewer']), uploadVideo.single('video'), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const { projectId, title, description, videoUrl: bodyUrl } = req.body;
    
    // Use file URL from upload or from request body
    const videoUrl = req.file ? req.file.path : bodyUrl;
    
    if (!videoUrl) {
      return res.status(400).json({ message: 'Video file or URL is required' });
    }

    const video = new Video({ 
      projectId, 
      title: title || (req.file ? req.file.originalname : 'Project Video'),
      description, 
      videoUrl, 
      uploadedBy: req.user.id,
      brand: activeBrand
    });
    
    await video.save();


    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'uploaded video', 
      entityType: 'video', 
      entityId: video._id,
      entityName: video.title,
      brand: activeBrand
    }).save();
    res.status(201).json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update video
router.put('/:id', auth, roleCheck(['admin', 'developer']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const video = await Video.findOneAndUpdate({ _id: req.params.id, brand: activeBrand }, req.body, { new: true });
    if (!video) return res.status(404).json({ message: 'Video not found or access denied' });
    
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'updated video', 
      entityType: 'video', 
      entityId: req.params.id,
      entityName: video.title,
      brand: activeBrand
    }).save();
    res.json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete video
router.delete('/:id', auth, roleCheck(['admin']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const video = await Video.findOne({ _id: req.params.id, brand: activeBrand });
    if (!video) {
      return res.status(404).json({ message: 'Video not found or access denied' });
    }

    // Delete file from disk if it's a local upload
    if (video.videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', video.videoUrl.substring(1));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Video.findByIdAndDelete(req.params.id);
    await new ActivityLog({ 
      userId: req.user.id, 
      action: 'deleted video', 
      entityType: 'video', 
      entityId: req.params.id,
      entityName: video.title,
      brand: activeBrand
    }).save();
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;