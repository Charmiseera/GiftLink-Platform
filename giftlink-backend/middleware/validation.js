/*jshint esversion: 8 */
const { body, validationResult } = require('express-validator');

/**
 * Validation middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Registration validation rules
 */
const validateRegistration = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Last name can only contain letters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['donor', 'receiver']).withMessage('Role must be either donor or receiver'),
  
  handleValidationErrors
];

/**
 * Login validation rules
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  body('role')
    .optional()
    .isIn(['donor', 'receiver']).withMessage('Role must be either donor or receiver'),
  
  handleValidationErrors
];

/**
 * Item validation rules
 */
const validateItem = [
  body('name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Item name must be 3-100 characters'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office']).withMessage('Invalid category'),
  
  body('condition')
    .notEmpty().withMessage('Condition is required')
    .isIn(['New', 'Like New', 'Good', 'Fair']).withMessage('Invalid condition'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  
  body('zipcode')
    .trim()
    .notEmpty().withMessage('Zipcode is required')
    .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zipcode format (e.g., 12345 or 12345-6789)'),
  
  body('image')
    .optional()
    .trim(),
  
  handleValidationErrors
];

/**
 * Request item validation rules
 */
const validateRequest = [
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 20, max: 500 }).withMessage('Reason must be 20-500 characters'),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitize user input to prevent XSS
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateItem,
  validateRequest,
  validateObjectId,
  sanitizeInput
};
