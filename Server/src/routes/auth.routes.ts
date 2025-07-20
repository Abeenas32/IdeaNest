import { rateLimitMiddleware } from './../middleware/security.middleware';
import { Router } from 'express';
import { register, login, refresh, logout, logoutAll, getProfile } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
// import { rateLimitMiddleware } from '../middleware/security.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

// Public routes with rate limiting
router.post('/register', rateLimitMiddleware, validate(registerSchema), register);
router.post('/login', rateLimitMiddleware, validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/profile', authenticate, getProfile);

export default router;