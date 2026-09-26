import mongoose from 'mongoose';

// Helper to check for dangerous NoSQL injection operators
export function hasNoSqlOperators(obj) {
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (typeof obj[key] === 'object' && hasNoSqlOperators(obj[key])) {
      return true;
    }
  }
  return false;
}

// Middleware to sanitize request body, query, and params against NoSQL injection
export function sanitizeNoSql(req, res, next) {
  if (hasNoSqlOperators(req.body) || hasNoSqlOperators(req.query) || hasNoSqlOperators(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request: Query operators and dollar prefixes are prohibited.'
    });
  }
  next();
}

// Middleware to validate MongoDB ObjectId parameters
export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}'. Must be a 24-character hexadecimal ObjectId.`
      });
    }
    next();
  };
}

// Middleware to validate pagination query parameters
export function validatePagination(req, res, next) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Pagination error: page must be >= 1 and limit must be between 1 and 100.'
    });
  }

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  next();
}
