require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

// Secure headers
app.use(helmet());

// Performance boost
app.use(compression());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/projectdb';
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
      console.warn('MongoDB connection URI is not defined in production environment');
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
    await seedAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (process.env.NODE_ENV === 'production') {
      throw err; // Fail hard in production
    }
  }
};

// Initial connection attempt
connectDB();

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const name = process.env.ADMIN_NAME || 'System Admin';
      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        name: name,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user seeded successfully');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
}

// Routes
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const credentialsRouter = require('./routes/credentials');
const videosRouter = require('./routes/videos');
const documentsRouter = require('./routes/documents');
const activityRouter = require('./routes/activity');

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/credentials', credentialsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/activity', activityRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ 
      status: 'OK', 
      dbConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  console.error(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;