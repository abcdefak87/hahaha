/**
 * Reusable Validation Rules
 * Centralized validation rules for consistent validation across the application
 */

const { body, param, query } = require('express-validator');

/**
 * User validation rules
 */
const userValidation = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .optional()
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  name: body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Name must be between 2 and 100 characters'),
  
  phone: body('phone')
    .optional()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/)
    .withMessage('Please provide a valid Indonesian phone number'),
  
  role: body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'gudang', 'user', 'technician'])
    .withMessage('Invalid role'),
  
  username: body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
};

/**
 * Customer validation rules
 */
const customerValidation = {
  name: body('name')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Customer name is required and must be between 2 and 100 characters'),
  
  phone: body('phone')
    .notEmpty()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/)
    .withMessage('Valid Indonesian phone number is required'),
  
  address: body('address')
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .trim()
    .withMessage('Address is required and must be between 10 and 500 characters'),
  
  package: body('package')
    .notEmpty()
    .isIn(['10mbps', '20mbps', '30mbps', '50mbps', '100mbps'])
    .withMessage('Valid package selection is required'),
  
  coordinates: body('coordinates')
    .optional()
    .isObject()
    .withMessage('Coordinates must be an object'),
  
  'coordinates.lat': body('coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  
  'coordinates.lng': body('coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
};

/**
 * Job validation rules
 */
const jobValidation = {
  type: body('type')
    .notEmpty()
    .isIn(['installation', 'repair', 'maintenance', 'survey'])
    .withMessage('Valid job type is required'),
  
  customerId: body('customerId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid customer ID is required'),
  
  technicianId: body('technicianId')
    .optional()
    .isUUID()
    .withMessage('Invalid technician ID'),
  
  scheduledDate: body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  priority: body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  status: body('status')
    .optional()
    .isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  notes: body('notes')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage('Notes cannot exceed 1000 characters')
};

/**
 * Inventory validation rules
 */
const inventoryValidation = {
  name: body('name')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Item name is required and must be between 2 and 100 characters'),
  
  category: body('category')
    .notEmpty()
    .isIn(['modem', 'router', 'cable', 'connector', 'tool', 'other'])
    .withMessage('Valid category is required'),
  
  quantity: body('quantity')
    .notEmpty()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer'),
  
  minStock: body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a positive integer'),
  
  unit: body('unit')
    .optional()
    .isIn(['pcs', 'meter', 'box', 'roll', 'set'])
    .withMessage('Invalid unit'),
  
  serialNumber: body('serialNumber')
    .optional()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Serial number can only contain uppercase letters, numbers, and hyphens'),
  
  supplier: body('supplier')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage('Supplier name cannot exceed 100 characters')
};

/**
 * Common validation rules
 */
const commonValidation = {
  id: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  search: query('search')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .escape()
    .withMessage('Search query cannot exceed 100 characters'),
  
  sortBy: query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'email', 'status'])
    .withMessage('Invalid sort field'),
  
  sortOrder: query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  dateFrom: query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom'),
  
  dateTo: query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo')
};

/**
 * File upload validation
 */
const fileValidation = {
  image: (fieldName) => body(fieldName)
    .custom((value, { req }) => {
      if (!req.file) return true; // Optional file
      
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error('File size cannot exceed 5MB');
      }
      
      return true;
    }),
  
  document: (fieldName) => body(fieldName)
    .custom((value, { req }) => {
      if (!req.file) return true; // Optional file
      
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedMimes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, and XLSX are allowed');
      }
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        throw new Error('File size cannot exceed 10MB');
      }
      
      return true;
    })
};

/**
 * Sanitization helpers
 */
const sanitize = {
  html: (fieldName) => body(fieldName)
    .trim()
    .escape(),
  
  sql: (fieldName) => body(fieldName)
    .trim()
    .blacklist(';\'"`'),
  
  xss: (fieldName) => body(fieldName)
    .customSanitizer(value => {
      // Remove potential XSS patterns
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    })
};

module.exports = {
  userValidation,
  customerValidation,
  jobValidation,
  inventoryValidation,
  commonValidation,
  fileValidation,
  sanitize
};
