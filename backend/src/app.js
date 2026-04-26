const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const deviceTrackingMiddleware = require('./middlewares/deviceTrackingMiddleware');
const prisma = require('./utils/prisma'); 
const errorHandler = require('./middlewares/errorHandler');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const uploadAuthMiddleware = require('./middlewares/uploadAuthMiddleware');

const app = express();
function attachSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join a specific report room
    socket.on('joinRoom', (data) => {
      const { reportId, userId } = data;
      const roomId = `report_${reportId}`;
      
      socket.join(roomId);
      socket.userId = userId;
      socket.currentRoom = roomId;
      
      console.log(`User ${userId} joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('userJoined', {
        userId,
        timestamp: new Date().toISOString()
      });
    });
    
    // Leave a room
    socket.on('leaveRoom', (data) => {
      const { reportId, userId } = data;
      const roomId = `report_${reportId}`;
      
      socket.leave(roomId);
      
      console.log(`User ${userId} left room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('userLeft', {
        userId,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      const { reportId, userId, isTyping } = data;
      const roomId = `report_${reportId}`;
      
      socket.to(roomId).emit('userTyping', {
        userId,
        isTyping,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle message read receipts
    socket.on('messageRead', (data) => {
      const { reportId, messageId, userId } = data;
      const roomId = `report_${reportId}`;
      
      socket.to(roomId).emit('messageReadReceipt', {
        messageId,
        userId,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Notify current room about user leaving
      if (socket.currentRoom && socket.userId) {
        socket.to(socket.currentRoom).emit('userLeft', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  app.set('io', io);
}

// Security: Helmet
app.use(helmet({
  crossOriginResourcePolicy: false, // Memastikan gambar/resource bisa dirender lintas origin
}));

// Security: Global Rate Limiter (500 request per 15 menit agar tidak terlalu ketat)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  message: {
    status: 'error',
    message: 'Terlalu banyak request dari IP ini, coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',  // Development
      'http://localhost:4173',  // Preview/Production
      'http://127.0.0.1:5173',  // Alternative localhost
      'http://127.0.0.1:4173',  // Alternative localhost
      process.env.FRONTEND_URL  // Environment variable
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'x-device-fingerprint'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser()); // For parsing cookies
app.use(morgan('dev')); // Logger untuk development
app.use(deviceTrackingMiddleware); // Track device information

// Serve uploaded files statically with Authentication
app.use('/uploads', uploadAuthMiddleware, express.static(path.join(__dirname, '../uploads')));

app.use('/v1/api/auth', require('./routes/authRoutes'));
app.use('/v1/api/users', require('./routes/userRoutes'));
app.use('/v1/api/categories', require('./routes/categoryRoutes'));
app.use('/v1/api/reports', require('./routes/reportRoutes'));
app.use('/v1/api/chat', require('./routes/chatRoutes'));
app.use('/v1/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/v1/api/admin', require('./routes/adminRoutes'));
app.use('/v1/api/bulk-operations', require('./routes/bulkOperationsRoutes'));

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

// Error handling middleware (after all routes)
app.use(errorHandler);

module.exports = { app, attachSocket };