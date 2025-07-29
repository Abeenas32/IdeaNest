import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAdmin, requireModerator, authenticate } from '../middleware/auth.middleware';
import { RateLimiterMiddleware } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { 
  updateUserRoleSchema, 
  bulkUpdateUserRolesSchema, 
  getUserByIdSchema, 
  getAllUsersSchema, 
  getAnalyticsSchema, 
  getModerationQueueSchema 
} from '../validators/admin.validator';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard and Analytics (Admin only)
router.get('/dashboard/stats', requireAdmin, RateLimiterMiddleware.readOperations, adminController.getDashboardStats);
router.get('/dashboard/analytics', requireAdmin, validate(getAnalyticsSchema), RateLimiterMiddleware.readOperations, adminController.getUserActivityAnalytics);
router.get('/system/health', requireAdmin, RateLimiterMiddleware.readOperations, adminController.getSystemHealth);

// User Management (Admin only)
router.get('/users', requireAdmin, validate(getAllUsersSchema), RateLimiterMiddleware.readOperations, adminController.getAllUsers);
router.get('/users/:userId', requireAdmin, validate(getUserByIdSchema), RateLimiterMiddleware.readOperations, adminController.getUserById);
router.put('/users/:userId/role', requireAdmin, validate(updateUserRoleSchema), RateLimiterMiddleware.updateOperations, adminController.updateUserRole);
router.put('/users/:userId/status', requireAdmin, validate(getUserByIdSchema), RateLimiterMiddleware.updateOperations, adminController.toggleUserStatus);
router.delete('/users/:userId', requireAdmin, validate(getUserByIdSchema), RateLimiterMiddleware.deleteOperations, adminController.deleteUser);

// Bulk Operations (Admin only)
router.put('/users/bulk/roles', requireAdmin, validate(bulkUpdateUserRolesSchema), RateLimiterMiddleware.updateOperations, adminController.bulkUpdateUserRoles);

// Content Moderation (Admin and Moderator)
router.get('/moderation/queue', requireModerator, validate(getModerationQueueSchema), RateLimiterMiddleware.readOperations, adminController.getModerationQueue);

export default router; 