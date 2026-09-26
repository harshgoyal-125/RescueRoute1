import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.'
  }
});

// Stricter rate limiter for authentication endpoints (anti-brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: ENV.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login/registration attempts from this IP. Please wait 15 minutes before retrying.'
  }
});

// Dedicated rate limiter for AI parsing endpoints
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: ENV.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI parsing requests from this IP. Please wait before retrying.'
  }
});

