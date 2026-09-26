import { ENV } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Safe server logging
  const safeMessage = err.message || 'Internal Server Error';
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, safeMessage);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. ')
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An entry with that ${field} already exists.`
    });
  }

  // Mongoose bad ObjectId CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found or invalid format for '${err.path}'.`
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }

  // Express JSON parser syntax error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload.'
    });
  }

  // Generic HTTP status
  const statusCode = err.statusCode || err.status || 500;

  // Never leak stack trace in production
  const response = {
    success: false,
    message: statusCode === 500 && ENV.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : safeMessage
  };

  if (ENV.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// 404 Route handler for undefined endpoints
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
}
