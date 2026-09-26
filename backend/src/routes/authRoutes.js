import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sanitizeNoSql } from '../middleware/validate.js';

const router = Router();

router.post('/register', authLimiter, sanitizeNoSql, register);
router.post('/login', authLimiter, sanitizeNoSql, login);
router.get('/me', authenticate, getMe);

export default router;
