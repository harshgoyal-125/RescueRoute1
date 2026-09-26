import { Router } from 'express';
import { isDbConnected } from '../config/db.js';

const router = Router();

router.get('/', (_req, res) => {
  const dbStatus = isDbConnected() ? 'connected' : 'disconnected';

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: dbStatus === 'connected',
    status: dbStatus === 'connected' ? 'healthy' : 'unavailable',
    timestamp: new Date().toISOString(),
    services: {
      api: 'online',
      database: dbStatus
    }
  });
});

export default router;
