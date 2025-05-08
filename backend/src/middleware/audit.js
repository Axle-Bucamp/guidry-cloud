/**
 * Audit logging middleware for Proxmox PaaS
 */
const db = require("../../config/database");

/**
 * Middleware to log user actions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logUserAction = async (req, res, next) => {
  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = async function(chunk, encoding) {
    // Restore the original end function
    res.end = originalEnd;
    
    // Call the original end function
    res.end(chunk, encoding);
    
    // Only log if user is authenticated
    if (req.user) {
      try {
        // Extract resource type and ID from URL
        const urlParts = req.path.split('/');
        let resourceType = 'unknown';
        let resourceId = null;
        
        if (urlParts.length >= 3) {
          if (urlParts[2] === 'vms' || urlParts[2] === 'vm') {
            resourceType = 'vm';
          } else if (urlParts[2] === 'containers' || urlParts[2] === 'lxc') {
            resourceType = 'container';
          } else if (urlParts[2] === 'users') {
            resourceType = 'user';
          } else if (urlParts[2] === 'organizations') {
            resourceType = 'organization';
          } else if (urlParts[2] === 'projects') {
            resourceType = 'project';
          }
          
          if (urlParts.length >= 4 && !isNaN(parseInt(urlParts[3]))) {
            resourceId = parseInt(urlParts[3]);
          }
        }
        
        // Determine action based on HTTP method
        let action;
        switch (req.method) {
          case 'GET':
            action = 'view';
            break;
          case 'POST':
            action = 'create';
            break;
          case 'PUT':
            action = 'update';
            break;
          case 'DELETE':
            action = 'delete';
            break;
          default:
            action = req.method.toLowerCase();
        }
        
        // Log the action
        await db.query(
          'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            req.user.id,
            action,
            resourceType,
            resourceId,
            JSON.stringify({
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              body: req.method !== 'GET' ? req.body : undefined
            }),
            req.ip
          ]
        );
      } catch (error) {
        console.error('Error logging user action:', error);
      }
    }
  };
  
  next();
};

/**
 * Get audit logs for a specific user
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of logs to return
 * @param {number} offset - Offset for pagination
 */
const getUserAuditLogs = async (userId, limit = 100, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT al.*, u.email as user_email 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return {
      success: true,
      logs: result.rows
    };
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Resource type
 * @param {number} resourceId - Resource ID
 * @param {number} limit - Maximum number of logs to return
 * @param {number} offset - Offset for pagination
 */
const getResourceAuditLogs = async (resourceType, resourceId, limit = 100, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT al.*, u.email as user_email 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.resource_type = $1 AND al.resource_id = $2
       ORDER BY al.created_at DESC
       LIMIT $3 OFFSET $4`,
      [resourceType, resourceId, limit, offset]
    );
    
    return {
      success: true,
      logs: result.rows
    };
  } catch (error) {
    console.error('Error getting resource audit logs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  logUserAction,
  getUserAuditLogs,
  getResourceAuditLogs
};
