const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyUser } = require('../middleware/auth');

// Auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyUser, authController.getMe);

module.exports = router;
