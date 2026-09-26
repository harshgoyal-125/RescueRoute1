import { Router } from 'express';
import {
  createPublicRequest,
  getAllRequests,
  updateRequestStatus,
  trackPublicRequest,
  getRequestSuggestions
} from '../controllers/foodRequestController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sanitizeNoSql, validateObjectId } from '../middleware/validate.js';
import { apiLimiter, requestTrackingLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public: Request status lookup requires full ID and the submitted phone number.
router.post('/track', requestTrackingLimiter, sanitizeNoSql, trackPublicRequest);

// Public: Submit food request
router.post('/', apiLimiter, sanitizeNoSql, createPublicRequest);

// Requester contact and delivery address are visible only to administrators.
router.get('/', authenticate, authorize('ADMIN'), getAllRequests);

// Admin-only, read-only candidate donations for a request.
router.get('/:id/suggestions', authenticate, authorize('ADMIN'), validateObjectId('id'), getRequestSuggestions);

// Admin: Update food request status
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateObjectId('id'), sanitizeNoSql, updateRequestStatus);

export default router;
