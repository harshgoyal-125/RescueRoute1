import { Router } from 'express';
import { getShelters, getShelterById, updateCapacity } from '../controllers/shelterController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateObjectId, sanitizeNoSql } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', getShelters);
router.get('/:id', validateObjectId('id'), getShelterById);
router.patch(
  '/:id/capacity',
  requireRole('SHELTER', 'ADMIN'),
  validateObjectId('id'),
  sanitizeNoSql,
  updateCapacity
);

export default router;
