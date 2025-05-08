/**
 * Admin routes for Proxmox PaaS
 */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const adminService = require('../services/admin');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/admin/system-status
 * @desc    Get system status
 * @access  Admin
 */
router.get('/system-status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await adminService.getSystemStatus();
    
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
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/user-statistics
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/user-statistics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await adminService.getUserStatistics();
    
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
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/resource-statistics
 * @desc    Get resource statistics
 * @access  Admin
 */
router.get('/resource-statistics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await adminService.getResourceStatistics();
    
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
    console.error('Error getting resource statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/audit-log-statistics
 * @desc    Get audit log statistics
 * @access  Admin
 */
router.get('/audit-log-statistics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await adminService.getAuditLogStatistics();
    
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
    console.error('Error getting audit log statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/system-health
 * @desc    Get system health
 * @access  Admin
 */
router.get('/system-health', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await adminService.getSystemHealth();
    
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
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Admin
 */
router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get system status
    const systemStatusResult = await adminService.getSystemStatus();
    
    if (!systemStatusResult.success) {
      return res.status(500).json({
        success: false,
        message: systemStatusResult.error
      });
    }
    
    // Get user statistics
    const userStatisticsResult = await adminService.getUserStatistics();
    
    if (!userStatisticsResult.success) {
      return res.status(500).json({
        success: false,
        message: userStatisticsResult.error
      });
    }
    
    // Get resource statistics
    const resourceStatisticsResult = await adminService.getResourceStatistics();
    
    if (!resourceStatisticsResult.success) {
      return res.status(500).json({
        success: false,
        message: resourceStatisticsResult.error
      });
    }
    
    // Get system health
    const systemHealthResult = await adminService.getSystemHealth();
    
    if (!systemHealthResult.success) {
      return res.status(500).json({
        success: false,
        message: systemHealthResult.error
      });
    }
    
    // Compile dashboard data
    const dashboardData = {
      systemStatus: systemStatusResult.data,
      userStatistics: userStatisticsResult.data,
      resourceStatistics: resourceStatisticsResult.data,
      systemHealth: systemHealthResult.data
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error getting admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
