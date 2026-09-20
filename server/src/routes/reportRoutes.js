const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All report routes require user authentication
router.use(authenticateToken);

router.post('/', upload.single('image'), reportController.createReport);
router.get('/my', reportController.getMyReports);
router.get('/:id', reportController.getReportById);

module.exports = router;
