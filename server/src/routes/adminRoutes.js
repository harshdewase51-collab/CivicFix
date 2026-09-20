const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/reports', adminController.getAllReports);
router.get('/reports/:id', adminController.getAdminReportById);
router.patch('/reports/:id/status', adminController.updateReportStatus);
router.get('/stats', adminController.getStats);

module.exports = router;
