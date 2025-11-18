/*jshint esversion: 8 */
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');

dotenv.config();
const logger = pino();

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and attaches user info to req.user
 * Usage: Add as middleware to protected routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Authentication failed: Invalid token');
        return res.status(403).json({ 
          error: 'Invalid or expired token. Please login again.' 
        });
      }

      // Check if id exists in token
      if (!decoded.id) {
        logger.warn('Authentication failed: Token missing user ID');
        return res.status(403).json({ 
          error: 'Invalid token format. Please login again.' 
        });
      }

      // Attach user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      logger.info(`User authenticated: ${decoded.email}`);
      next();
    });

  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authentication' 
    });
  }
};

/**
 * Optional Authentication Middleware
 * 
 * Tries to authenticate but doesn't fail if token is missing/invalid
 * Useful for routes that work with or without authentication
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = {
          id: decoded.id,
          email: decoded.email
        };
      }
      next();
    });

  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
