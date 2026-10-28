const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateJWT } = require('../utils/generateToken');

// Email regex helper
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Register a new student user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Field presence checks
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Email format validation
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Minimum password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Confirm password check if provided
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Application-level duplicate check
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword
    });

    const token = generateJWT({ id: newUser._id, email: newUser.email });

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in an existing student user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user with password explicitly included
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateJWT({ id: user._id, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log out user (clears client session)
 * POST /api/auth/logout
 */
async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
