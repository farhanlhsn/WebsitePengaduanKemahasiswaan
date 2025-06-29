const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const authMiddleware = require('../middlewares/authMiddleware'); // We'll need to create this
// Public routes
router.post('/login', authControllers.login);
router.post('/registerStudent', authControllers.registerStudent);
router.post('/registerAdmin', authControllers.registerAdmin);
router.post('/logout', authControllers.logout);
router.post('/refresh-token', authControllers.refreshToken);

// Protected routes (require authentication)
router.use(authMiddleware); // Apply to all routes below

// Device Management routes
router.get('/devices', authControllers.getUserDevices);
router.delete('/devices/:id', authControllers.logoutDevice);
router.post('/logout-other-devices', authControllers.logoutAllOtherDevices);

module.exports = router;