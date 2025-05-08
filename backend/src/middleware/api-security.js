/**
 * API security middleware for Proxmox PaaS
 */
const crypto = require('crypto');
const db = require('../config/database');
const vaultService = require('../services/vault');

/**
 * Middleware to validate API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateApiKey = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Hash the API key for comparison
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Check if API key exists in database
    const result = await db.query(
      'SELECT * FROM api_keys WHERE key_hash = $1 AND (expires_at IS NULL OR expires_at > NOW())',
      [keyHash]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key'
      });
    }
    
    // Get user associated with API key
    const apiKeyData = result.rows[0];
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [apiKeyData.user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User associated with API key not found'
      });
    }
    
    // Add user to request
    req.user = userResult.rows[0];
    
    // Log API key usage
    await db.query(
      'INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [
        req.user.id,
        'api_access',
        'api',
        JSON.stringify({ 
          method: req.method, 
          path: req.path,
          api_key_id: apiKeyData.id,
          api_key_name: apiKeyData.name
        }),
        req.ip
      ]
    );
    
    return next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate a new API key
 * @param {number} userId - User ID
 * @param {string} name - API key name
 * @param {Date} expiresAt - Expiration date (optional)
 */
const generateApiKey = async (userId, name, expiresAt = null) => {
  try {
    // Generate random API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Hash the API key for storage
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Store API key in database
    const result = await db.query(
      'INSERT INTO api_keys (user_id, name, key_hash, expires_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, name, keyHash, expiresAt]
    );
    
    // Store original API key in Vault for initial retrieval
    await vaultService.storeAPIKey(`user_${userId}_${result.rows[0].id}`, apiKey);
    
    return {
      success: true,
      apiKey,
      id: result.rows[0].id
    };
  } catch (error) {
    console.error('Error generating API key:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Revoke an API key
 * @param {number} apiKeyId - API key ID
 */
const revokeApiKey = async (apiKeyId) => {
  try {
    // Delete API key from database
    await db.query(
      'DELETE FROM api_keys WHERE id = $1',
      [apiKeyId]
    );
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error revoking API key:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  validateApiKey,
  generateApiKey,
  revokeApiKey
};
