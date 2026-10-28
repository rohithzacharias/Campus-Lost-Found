const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyUser } = require('../middleware/auth');

// Protected endpoint to fetch user's reports
router.get('/me/reports', verifyUser, reportController.getMyReports);

module.exports = router;
