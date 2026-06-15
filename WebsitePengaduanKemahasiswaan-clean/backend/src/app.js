const path = require('path');

if (process.env.E2E_BOOTSTRAP !== 'true') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
}
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const deviceTrackingMiddleware = require('./middlewares/deviceTrackingMiddleware');
const prisma = require('./utils/prisma'); 
const errorHandler = require('./middlewares/errorHandler');
const helmet = require('helmet');
const { setupSocket } = require('./sockets/chatHandler');
const rateLimit = require('express-rate-limit');
const uploadAuthMiddleware = require('./middlewares/uploadAuthMiddleware');
const fileAccessMiddleware = require('./middlewares/fileAccessMiddleware');

const app = express();

// Trust proxy only when explicitly configured (production behind reverse proxy).
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === 'false' || trustProxy === '0') {
  app.set('trust proxy', false);
} else if (trustProxy === 'true') {
  app.set('trust proxy', true);
} else if (trustProxy) {
  const hopCount = Number(trustProxy);
  app.set('trust proxy', Number.isFinite(hopCount) ? hopCount : trustProxy);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

function attachSocket(server) {
  const io = setupSocket(server);
  app.set('io', io);
}

// Security: Helmet with hardened CSP for production
const isProduction = process.env.NODE_ENV === 'production';
app.use(helmet({
  // Allow images/files to render across origins (frontend and backend on different hosts)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // CSP: restrictive in production, lenient (default) in development to avoid blocking Vite dev tools
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // MUI emotion injects inline styles
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: [
            "'self'",
            process.env.FRONTEND_URL,
          ].filter(Boolean),
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  hsts: isProduction
    ? { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Security: Global Rate Limiter (500 request per 15 menit agar tidak terlalu ketat)
const redisClient = require('./utils/redis');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');

let rateLimitStore;
if (redisClient) {
  rateLimitStore = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  message: {
    status: 'error',
    message: 'Terlalu banyak request dari IP ini, coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore,
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
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : [])
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
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser()); // For parsing cookies

// Sanitize all request body strings (XSS prevention)
const sanitizeMiddleware = require('./middlewares/sanitizeMiddleware');
app.use(sanitizeMiddleware);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(deviceTrackingMiddleware); // Track device information

// Serve uploaded files with auth + ownership checks. Non-images use Content-Disposition: attachment.
const uploadsRoot = path.join(__dirname, '../uploads');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);

app.use(
  '/uploads',
  uploadAuthMiddleware,
  fileAccessMiddleware,
  express.static(uploadsRoot, {
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      if (!imageExtensions.has(ext)) {
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  })
);

app.use('/v1/api/auth', require('./routes/authRoutes'));
app.use('/v1/api/users', require('./routes/userRoutes'));
app.use('/v1/api/categories', require('./routes/categoryRoutes'));
app.use('/v1/api/reports', require('./routes/reportRoutes'));
app.use('/v1/api/chat', require('./routes/chatRoutes'));
app.use('/v1/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/v1/api/admin', require('./routes/adminRoutes'));
app.use('/v1/api/admin-governance', require('./routes/adminGovernanceRoutes'));
app.use('/v1/api/bulk-operations', require('./routes/bulkOperationsRoutes'));

// API documentation (Swagger UI) — enabled outside production by default,
// or when ENABLE_SWAGGER=true in production for staging/debugging.
const enableSwagger = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';
if (enableSwagger) {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Pengaduan Kemahasiswaan API',
      swaggerOptions: { persistAuthorization: true },
    })
  );
}

// Health checks
/**
 * @swagger
 * /api/health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe (process up)
 *     security: []
 *     responses:
 *       200: { description: Process is live }
 *
 * /api/health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe (DB reachable)
 *     security: []
 *     responses:
 *       200: { description: Ready to serve traffic }
 *       503: { description: Dependencies not reachable }
 *
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Aggregate health check
 *     security: []
 *     responses:
 *       200: { description: Service healthy }
 *       500: { description: Service unhealthy }
 */
// Liveness: process is up (does not depend on external services)
app.get('/api/health/live', (req, res) => {
  res.status(200).json({
    status: 'success',
    state: 'live',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness: dependencies (DB + Redis) reachable
app.get('/api/health/ready', async (req, res) => {
  const checks = { database: 'fail', redis: 'skipped' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';

    const redis = require('./utils/redis');
    if (redis) {
      await redis.ping();
      checks.redis = 'ok';
    } else if (process.env.ALLOW_IN_MEMORY_RATE_LIMIT === 'true') {
      checks.redis = 'skipped';
    } else if (process.env.NODE_ENV !== 'production') {
      checks.redis = 'skipped';
    } else {
      checks.redis = 'fail';
      return res.status(503).json({
        status: 'error',
        state: 'not-ready',
        checks,
        message: 'Redis unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      status: 'success',
      state: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      state: 'not-ready',
      checks,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Backward-compatible aggregated health check (DB)
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

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware (after all routes)
app.use(errorHandler);

module.exports = { app, attachSocket };