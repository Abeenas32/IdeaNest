import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { adminService } from '../services/admin.service';
import { sendSuccess, sendError } from '../utils/response.utils';
import { validate } from '../middleware/validation.middleware';

export class AdminController {
  /**
   * Get admin dashboard statistics
   */
  getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await adminService.getAdminStats();
      sendSuccess(res, stats, 'Admin dashboard statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all users with pagination and filtering
   */
  getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      
      const filters = {
        role: req.query.role as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isEmailVerified: req.query.isEmailVerified === 'true' ? true : req.query.isEmailVerified === 'false' ? false : undefined,
        search: req.query.search as string
      };

      const result = await adminService.getAllUsers(page, limit, filters);
      sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user role (admin only)
   */
  updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'moderator'].includes(role)) {
        sendError(res, 'Invalid role. Must be user, admin, or moderator', 400);
        return;
      }

      const updatedUser = await adminService.updateUserRole(userId, role);
      sendSuccess(res, { user: updatedUser }, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle user active status
   */
  toggleUserStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const updatedUser = await adminService.toggleUserStatus(userId);
      sendSuccess(res, { user: updatedUser }, 'User status toggled successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user (soft delete)
   */
  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      await adminService.deleteUser(userId);
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user activity analytics
   */
  getUserActivityAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await adminService.getUserActivityAnalytics(days);
      sendSuccess(res, analytics, 'User activity analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get content moderation queue
   */
  getModerationQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const result = await adminService.getModerationQueue(page, limit);
      sendSuccess(res, result, 'Moderation queue retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID (admin view)
   */
  getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await adminService.getAllUsers(1, 1, { search: userId });
      
      if (result.users.length === 0) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, { user: result.users[0] }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update user roles
   */
  bulkUpdateUserRoles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { updates } = req.body; // Array of { userId, role }

      if (!Array.isArray(updates)) {
        sendError(res, 'Updates must be an array', 400);
        return;
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          if (!['user', 'admin', 'moderator'].includes(update.role)) {
            errors.push({ userId: update.userId, error: 'Invalid role' });
            continue;
          }

          const updatedUser = await adminService.updateUserRole(update.userId, update.role);
          results.push(updatedUser);
        } catch (error) {
          errors.push({ userId: update.userId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      sendSuccess(res, { 
        updated: results, 
        errors: errors.length > 0 ? errors : undefined 
      }, `Bulk update completed. ${results.length} users updated, ${errors.length} errors`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get system health and performance metrics
   */
  getSystemHealth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await adminService.getAdminStats();
      
      // Add system performance metrics
      const systemHealth = {
        ...stats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString()
        }
      };

      sendSuccess(res, systemHealth, 'System health metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
