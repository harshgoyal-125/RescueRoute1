import { Router } from 'express';
import { getImpactMetrics } from '../controllers/dashboardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/impact', authenticate, requireRole('ADMIN'), getImpactMetrics);

export default router;
