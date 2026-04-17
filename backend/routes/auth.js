const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, roleCheck } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../lib/email');

const router = express.Router();

// Get all users for assignment (Admin only, brand-isolated)
router.get('/users', auth, roleCheck(['admin']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const users = await User.find({ brand: activeBrand }, 'name role email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  
  // Validate input
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
    
    const user = new User({ 
      email, 
      password: hashedPassword, 
      name, 
      role: role || 'viewer',
      brand: activeBrand
    });
    await user.save();
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ 
      message: err.message || 'Registration failed' 
    });
  }
});

// Admin adds employee
router.post('/employees', auth, roleCheck(['admin']), async (req, res) => {
  const { email, password, name, mobileNumber, role } = req.body;
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name,
      mobileNumber,
      role: role || 'viewer',
      brand: activeBrand
    });

    await user.save();

    // Send Welcome Email
    const dashboardUrl = `${req.get('origin') || 'http://localhost:3000'}/login`;
    const mailResult = await sendWelcomeEmail({
      email,
      password, // Send raw password in welcome email as requested
      name,
      brand: activeBrand,
      dashboardUrl
    });

    res.status(201).json({ 
      message: 'Employee added successfully',
      previewUrl: mailResult.previewUrl,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Add employee error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin deletes employee
router.delete('/users/:id', auth, roleCheck(['admin']), async (req, res) => {
  const activeBrand = req.headers['x-selected-brand'] || 'antigraviity';
  try {
    const user = await User.findOne({ _id: req.params.id, brand: activeBrand });
    if (!user) {
      return res.status(404).json({ message: 'User not found or access denied' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete an administrator' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Force a DB connection check if it's the first request or a cold start
    const User = require('../models/User'); // ensure model is loaded
    const userCount = await User.countDocuments();
    
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Login route error:', err);
    
    // Check if the error is related to database connection
    if (err.name === 'MongooseServerSelectionError' || err.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: 'Database connection failed. Please check if your IP is whitelisted in MongoDB Atlas.',
        details: err.message
      });
    }
    
    res.status(500).json({ message: 'Internal Server Error: ' + err.message });
  }
});


module.exports = router;