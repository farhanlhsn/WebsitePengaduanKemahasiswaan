const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const passwordResetControllers = require('../controllers/passwordResetControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const {
  KTM_MIMES,
  createMulterFilename,
  createMulterFileFilter,
  createValidateUploadedMiddleware,
} = require('../utils/fileValidation');
const compressImagesMiddleware = require('../middlewares/compressImagesMiddleware');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  refreshTokenLimiter,
} = require('../middlewares/rateLimiters');


const ktmStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads/ktm')),
  filename: (req, file, cb) => createMulterFilename(req, file, cb, KTM_MIMES),
});
const ktmUpload = multer({
  storage: ktmStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createMulterFileFilter(KTM_MIMES),
});
const validateKtmUpload = createValidateUploadedMiddleware(KTM_MIMES);
// Public routes
/**
 * @swagger
 * /v1/api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dengan email + password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login berhasil. Set httpOnly cookie `refreshToken`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email atau password salah
 *       429:
 *         description: Rate limit terlampaui
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isString().isLength({ min: 1 }).withMessage('Password is required'),
  ],
  validate,
  authControllers.login
);
/**
 * @swagger
 * /v1/api/auth/registerStudent:
 *   post:
 *     tags: [Auth]
 *     summary: Registrasi mahasiswa dengan upload KTM
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, password, nim, ktm]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               nim: { type: string, description: 'Min 8 digit angka' }
 *               ktm: { type: string, format: binary, description: 'Foto KTM (JPEG/PNG/WebP, max 5MB)' }
 *     responses:
 *       201: { description: Akun dibuat, menunggu verifikasi admin }
 *       400: { description: Validasi gagal }
 *       429: { description: Rate limit terlampaui }
 */
router.post('/registerStudent', 
  registerLimiter,
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
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('nim').matches(/^\d{8,}$/).withMessage('NIM must contain at least 8 digits'),
  ],
  validate,
  validateKtmUpload,
  compressImagesMiddleware,
  authControllers.registerStudent
);
/**
 * @swagger
 * /v1/api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (clear refresh token cookie)
 *     responses:
 *       200: { description: Logout berhasil }
 */
router.post('/logout', authControllers.logout);

/**
 * @swagger
 * /v1/api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Issue new access token from refresh cookie
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Refresh cookie missing }
 *       403: { description: Refresh token invalid or expired }
 */
router.post('/refresh-token', refreshTokenLimiter, authControllers.refreshToken);

/**
 * @swagger
 * /v1/api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset link via email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Always success (no email enumeration) }
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [body('email').isEmail().withMessage('Email is invalid')],
  validate,
  passwordResetControllers.forgotPassword
);
/**
 * @swagger
 * /v1/api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token from email link
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password reset, all sessions invalidated }
 *       400: { description: Token invalid or expired }
 */
router.post(
  '/reset-password',
  forgotPasswordLimiter,
  [
    body('token').trim().notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  passwordResetControllers.resetPassword
);

// Protected routes (require authentication)
router.use(authMiddleware); // Apply to all routes below

// Change password (authenticated user)
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  passwordResetControllers.changePassword
);

// Device Management routes
router.get('/devices', authControllers.getUserDevices);
router.delete('/devices/:id', [
  param('id').isInt().withMessage('Device id must be an integer')
], validate, authControllers.logoutDevice);
router.post('/logout-other-devices', authControllers.logoutAllOtherDevices);

module.exports = router;