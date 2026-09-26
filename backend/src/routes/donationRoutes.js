import { Router } from 'express';
import {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation
} from '../controllers/donationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateObjectId, validatePagination, sanitizeNoSql } from '../middleware/validate.js';

const router = Router();

// Apply auth to all donation routes
router.use(authenticate);

router.get('/', validatePagination, sanitizeNoSql, getDonations);
router.post('/', requireRole('DONOR', 'ADMIN'), sanitizeNoSql, createDonation);
router.get('/:id', validateObjectId('id'), getDonationById);
router.patch('/:id', validateObjectId('id'), sanitizeNoSql, updateDonation);
router.delete('/:id', validateObjectId('id'), deleteDonation);

export default router;
