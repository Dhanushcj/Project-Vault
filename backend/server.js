require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Fallback for JWT_SECRET if not provided in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'antigraviity_default_secret_2024';
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET is not defined. Using a default fallback secret. This is NOT secure for production!');
  }
}

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

// MongoDB Connection Cache for Serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, lastError: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/projectdb';
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
      console.warn('MongoDB connection URI is not defined in production environment');
    }

    const opts = {
      bufferCommands: false, // Stop the 10-second hang if connection fails
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging
      socketTimeoutMS: 45000,
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    cached.lastError = null;
    await seedAdmin();
  } catch (err) {
    cached.promise = null; // Reset promise so we can retry on next request
    cached.lastError = err.message;
    console.error('Critical MongoDB connection error:', err.message);
    if (err.stack) console.error(err.stack);
    
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
  }

  return cached.conn;
};

// Start connection but don't await (it will be awaited in the request handler if needed)
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

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    const conn = await connectDB();
    if (!conn && process.env.NODE_ENV === 'production') {
      return res.status(503).json({ 
        message: 'Database connection failed.',
        error: cached.lastError || 'Initialization timeout',
        tip: 'Check your MONGODB_URI and IP Whitelist on Atlas.'
      });
    }
    next();
  } catch (err) {
    console.error('Middleware connection error:', err);
    res.status(500).json({ message: 'Internal Server Error: Database unavailable' });
  }
});

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