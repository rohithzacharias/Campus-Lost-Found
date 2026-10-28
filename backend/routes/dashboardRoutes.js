const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { optionalAuth } = require('../middleware/auth');

// Public dashboard stats endpoint with optional user context
router.get('/stats', optionalAuth, dashboardController.getDashboardStats);

module.exports = router;
