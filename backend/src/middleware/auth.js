/**
 * Authentication middleware for Proxmox PaaS
 */
const passport = require('passport');
const jwt = require('jsonwebtoken');

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAuthenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required'
      });
    }
    
    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Admin access required'
  });
};

/**
 * Middleware to check if user belongs to an organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isOrganizationMember = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user.id;
    
    // Check if user is an admin (admins have access to all organizations)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is a member of the organization
    const db = require('../config/database');
    const result = await db.query(
      'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this organization'
      });
    }
    
    // Add organization role to request
    req.organizationRole = result.rows[0].role;
    return next();
  } catch (error) {
    console.error('Error checking organization membership:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user has access to a resource
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const hasResourceAccess = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const userId = req.user.id;
    
    // Check if user is an admin (admins have access to all resources)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check resource access based on type
    const db = require('../config/database');
    let result;
    
    switch (resourceType) {
      case 'vm':
        result = await db.query(
          `SELECT vm.* FROM virtual_machines vm
           JOIN projects p ON vm.project_id = p.id
           JOIN organization_members om ON p.organization_id = om.organization_id
           WHERE vm.id = $1 AND om.user_id = $2`,
          [resourceId, userId]
        );
        break;
      case 'container':
        result = await db.query(
          `SELECT c.* FROM lxc_containers c
           JOIN projects p ON c.project_id = p.id
           JOIN organization_members om ON p.organization_id = om.organization_id
           WHERE c.id = $1 AND om.user_id = $2`,
          [resourceId, userId]
        );
        break;
      case 'project':
        result = await db.query(
          `SELECT p.* FROM projects p
           JOIN organization_members om ON p.organization_id = om.organization_id
           WHERE p.id = $1 AND om.user_id = $2`,
          [resourceId, userId]
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid resource type'
        });
    }
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have access to this ${resourceType}`
      });
    }
    
    return next();
  } catch (error) {
    console.error('Error checking resource access:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isOrganizationMember,
  hasResourceAccess,
  generateToken
};
