/**
 * Authentication routes for Proxmox PaaS
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import OAuth strategy and authentication middleware
require('../middleware/oauth');
const { isAuthenticated, generateToken } = require('../middleware/auth');

/**
 * @route   GET /api/auth/oauth
 * @desc    Initiate OAuth authentication
 * @access  Public
 */
router.get('/oauth', passport.authenticate('oauth2'));

/**
 * @route   GET /api/auth/callback
 * @desc    OAuth callback handler
 * @access  Public
 */
router.get('/callback', 
  passport.authenticate('oauth2', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Use middleware's generateToken
    const token = generateToken(req.user);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * @route   GET /api/auth/user
 * @desc    Get current user info
 * @access  Private
 */
router.get('/user', isAuthenticated, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', isAuthenticated, (req, res) => {
  // JWT is stateless, so we just return success
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
