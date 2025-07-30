import { Router } from 'express';
import authRoutes from './auth.routes';
import { ideaRoutes } from './idea.routes';
import { LikeRoutes } from './like.routes';
import  { userRoutes }from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/ideas', ideaRoutes);
router.use('/likes', LikeRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

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