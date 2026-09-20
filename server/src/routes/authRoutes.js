const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected session & profile routes
router.get('/me', authenticateToken, authController.getMe);
router.patch('/profile', authenticateToken, authController.updateProfile);
router.post('/profile-photo', authenticateToken, upload.single('photo'), authController.uploadAvatar);
router.delete('/profile-photo', authenticateToken, authController.removeAvatar);
router.post('/profile/avatar', authenticateToken, upload.single('photo'), authController.uploadAvatar);
router.delete('/profile/avatar', authenticateToken, authController.removeAvatar);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;

