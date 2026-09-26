import { Router } from 'express';
import { findMatches, getMatches, getMatchById, acceptMatch } from '../controllers/matchController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

// Deterministic matching endpoint for a donation
router.post('/find', findMatches);

// Retrieval endpoints
router.get('/', requireRole('SHELTER', 'ADMIN'), getMatches);
router.get('/:id', validateObjectId('id'), getMatchById);

// Acceptance endpoints (supports both POST and PATCH)
router.post('/:id/accept', requireRole('SHELTER', 'ADMIN'), validateObjectId('id'), acceptMatch);
router.patch('/:id/accept', requireRole('SHELTER', 'ADMIN'), validateObjectId('id'), acceptMatch);

export default router;
