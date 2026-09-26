import { Router } from 'express';
import {
  getDeliveries,
  getDeliveryById,
  assignDelivery,
  updateDeliveryStatus
} from '../controllers/deliveryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateObjectId, sanitizeNoSql } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

// Delivery listing (scoped by caller role in controller)
router.get('/', requireRole('DRIVER', 'ADMIN', 'SHELTER', 'DONOR'), getDeliveries);

// Single delivery view
router.get('/:id', validateObjectId('id'), getDeliveryById);

// Volunteer driver assignment
router.post(
  '/:id/assign',
  requireRole('DRIVER', 'ADMIN'),
  validateObjectId('id'),
  assignDelivery
);

// State machine status transition
router.patch(
  '/:id/status',
  requireRole('DRIVER', 'ADMIN'),
  validateObjectId('id'),
  sanitizeNoSql,
  updateDeliveryStatus
);

export default router;
