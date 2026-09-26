import { Router } from 'express';
import {
  createPublicRequest,
  getAllRequests,
  updateRequestStatus
} from '../controllers/foodRequestController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sanitizeNoSql, validateObjectId } from '../middleware/validate.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public: Submit food request
router.post('/', apiLimiter, sanitizeNoSql, createPublicRequest);

// Authenticated: View food requests (Admin, Shelter)
router.get('/', authenticate, authorize('ADMIN', 'SHELTER'), getAllRequests);

// Admin: Update food request status
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateObjectId('id'), sanitizeNoSql, updateRequestStatus);

export default router;
