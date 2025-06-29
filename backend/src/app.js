require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const deviceTrackingMiddleware = require('./middlewares/deviceTrackingMiddleware');
const prisma = require('./utils/prisma'); 

const app = express();

// Enable compression for all responses
app.use(compression({
  level: 6, // Compression level (1-9, where 9 is best compression but slowest)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if the request includes a cache-control header that includes no-transform
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    // Compress all other responses
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser()); // For parsing cookies
app.use(morgan('dev')); // Logger untuk development
app.use(deviceTrackingMiddleware); // Track device information

app.use('/v1/api/auth', require('./routes/authRoutes'));
app.use('/v1/api/users', require('./routes/userRoutes'));
app.use('/v1/api/categories', require('./routes/categoryRoutes'));
app.use('/v1/api/reports', require('./routes/reportRoutes'));

// Test koneksi database
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'success',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Selamat datang di API Pengaduan Kemahasiswaan',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;