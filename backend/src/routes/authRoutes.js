const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // batasan 10 request (sesuai permintaan, batas aman)
  message: {
    status: 'error',
    message: 'Terlalu banyak percobaan login/registrasi dari IP ini, silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


const ktmStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/ktm')),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const ktmUpload = multer({ 
    storage: ktmStorage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      // Validasi file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP are allowed'), false);
      }
    }
  });
// Public routes
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authControllers.login
);
router.post('/registerStudent', 
  authLimiter,
  (req, res, next) => {
    ktmUpload.single('ktm')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'File too large',
            message: 'File size must be less than 5MB' 
          });
        }
        return res.status(400).json({ 
          error: 'File upload error',
          message: err.message 
        });
      } else if (err) {
        return res.status(400).json({ 
          error: 'File validation error',
          message: err.message 
        });
      }
      next();
    });
  },
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('nim').matches(/^\d{8,}$/).withMessage('NIM must contain at least 8 digits'),
  ],
  validate,
  compressImagesMiddleware, 
  authControllers.registerStudent
);
router.post(
  '/registerAdmin',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authControllers.registerAdmin
);
router.post('/logout', authControllers.logout);
router.post('/refresh-token', authControllers.refreshToken);

// Protected routes (require authentication)
router.use(authMiddleware); // Apply to all routes below

// Device Management routes
router.get('/devices', authControllers.getUserDevices);
router.delete('/devices/:id', [
  param('id').isInt().withMessage('Device id must be an integer')
], validate, authControllers.logoutDevice);
router.post('/logout-other-devices', authControllers.logoutAllOtherDevices);

module.exports = router;