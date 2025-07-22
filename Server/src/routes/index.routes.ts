import { Router } from 'express';
import authRoutes from './auth.routes';
import { ideaRoutes } from './idea.routes';

const router = Router();

// API routes
router.use('api/v1/auth', authRoutes);
router.use('api/v1/ideas', ideaRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export { router as apiRoutes };