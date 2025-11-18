/*jshint esversion: 8 */
const pino = require('pino');

const logger = pino();

/**
 * Admin Authorization Middleware
 * 
 * Checks if the authenticated user has admin role
 * Must be used AFTER authenticateToken middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user) {
      logger.warn('Admin access attempt without authentication');
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized admin access attempt by ${req.user.email}`);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    logger.info(`Admin access granted: ${req.user.email}`);
    next();

  } catch (error) {
    logger.error('Admin authorization error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authorization' 
    });
  }
};

module.exports = {
  requireAdmin
};
