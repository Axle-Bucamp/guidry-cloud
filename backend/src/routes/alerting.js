/**
 * Alerting routes for Proxmox PaaS
 */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const alertingService = require('../services/alerting');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/alerting/active
 * @desc    Get active alerts
 * @access  Admin
 */
router.get('/active', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await alertingService.getActiveAlerts();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/alerting/history
 * @desc    Get alert history
 * @access  Admin
 */
router.get('/history', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await alertingService.getAlertHistory(limit, offset);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting alert history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/alerting/resolve/:id
 * @desc    Resolve an alert
 * @access  Admin
 */
router.post('/resolve/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await alertingService.resolveAlert(id);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/alerting/check
 * @desc    Manually check for alerts
 * @access  Admin
 */
router.post('/check', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await alertingService.checkAlerts();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
