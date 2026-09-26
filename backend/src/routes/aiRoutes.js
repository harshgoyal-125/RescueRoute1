import { Router } from 'express';
import { parseDonation, explainMatch } from '../controllers/aiController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Secure AI endpoint: requires valid JWT, DONOR or ADMIN role, and dedicated rate limiting
router.post(
  '/parse-donation',
  authenticate,
  requireRole('DONOR', 'ADMIN'),
  aiLimiter,
  parseDonation
);

// Secure AI endpoint: generates natural-language explanation for an existing deterministic match
router.post(
  '/explain-match',
  authenticate,
  requireRole('DONOR', 'SHELTER', 'ADMIN'),
  aiLimiter,
  explainMatch
);

export default router;

