import { User, IUser } from '../models/User.model';
import { Idea } from '../models/Idea.models';
import { Like } from '../models/like.model';
import { AdminUser, AdminStats } from '../types/auth.types';
import { CacheService } from './cache.service';
import mongoose from 'mongoose';

export class AdminService {
  /**
   * Get comprehensive admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const cacheKey = 'admin:stats';
      const cachedStats = await CacheService.get<AdminStats>(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        totalIdeas,
        totalLikes,
        activeUsers,
        verifiedUsers,
        adminUsers,
        moderatorUsers,
        ideasThisMonth,
        likesThisMonth
      ] = await Promise.all([
        User.countDocuments({ deletedAt: null }),
        Idea.countDocuments(),
        Like.countDocuments(),
        User.countDocuments({ isActive: true, deletedAt: null }),
        User.countDocuments({ isEmailVerified: true, deletedAt: null }),
        User.countDocuments({ role: 'admin', isActive: true, deletedAt: null }),
        User.countDocuments({ role: 'moderator', isActive: true, deletedAt: null }),
        Idea.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Like.countDocuments({ createdAt: { $gte: startOfMonth } })
      ]);

      const stats: AdminStats = {
        totalUsers,
        totalIdeas,
        totalLikes,
        activeUsers,
        verifiedUsers,
        adminUsers,
        moderatorUsers,
        ideasThisMonth,
        likesThisMonth
      };

      // Cache for 5 minutes
      await CacheService.set(cacheKey, stats, { ttl: 300 });
      return stats;
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw new Error('Failed to get admin statistics');
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(page: number = 1, limit: number = 20, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;
      const query: any = { deletedAt: null };

      // Apply filters
      if (filters.role) query.role = filters.role;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.isEmailVerified !== undefined) query.isEmailVerified = filters.isEmailVerified;
      if (filters.search) {
        query.$or = [
          { email: { $regex: filters.search, $options: 'i' } },
          { name: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshTokens')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      // Get user statistics
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [totalIdeas, totalLikes] = await Promise.all([
            Idea.countDocuments({ authorId: user._id }),
            Like.countDocuments({ userId: user._id })
          ]);

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            totalIdeas,
            totalLikes
          } as AdminUser;
        })
      );

      return {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, newRole: 'user' | 'admin' | 'moderator'): Promise<AdminUser> {
    try {
      if (!['user', 'admin', 'moderator'].includes(newRole)) {
        throw new Error('Invalid role');
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true }
      ).select('-password -refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      // Clear cache
      await CacheService.delete('admin:stats');

      const [totalIdeas, totalLikes] = await Promise.all([
        Idea.countDocuments({ authorId: user._id }),
        Like.countDocuments({ userId: user._id })
      ]);

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        totalIdeas,
        totalLikes
      } as AdminUser;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string): Promise<AdminUser> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = !user.isActive;
      await user.save();

      // Clear cache
      await CacheService.delete('admin:stats');

      const [totalIdeas, totalLikes] = await Promise.all([
        Idea.countDocuments({ authorId: user._id }),
        Like.countDocuments({ userId: user._id })
      ]);

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        totalIdeas,
        totalLikes
      } as AdminUser;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete
      user.deletedAt = new Date();
      user.isActive = false;
      await user.save();

      // Clear cache
      await CacheService.delete('admin:stats');

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user activity analytics
   */
  async getUserActivityAnalytics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const [userRegistrations, ideaCreations, likeActions] = await Promise.all([
        User.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Idea.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Like.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      return {
        userRegistrations,
        ideaCreations,
        likeActions,
        period: `${days} days`
      };
    } catch (error) {
      console.error('Error getting user activity analytics:', error);
      throw new Error('Failed to get activity analytics');
    }
  }

  /**
   * Get content moderation queue
   */
  async getModerationQueue(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get ideas that might need moderation (high like count, recent, etc.)
      const ideas = await Idea.find({
        isPublic: true,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
        .populate('authorId', 'email name role')
        .sort({ likeCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Idea.countDocuments({
        isPublic: true,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        ideas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting moderation queue:', error);
      throw new Error('Failed to get moderation queue');
    }
  }
}

export const adminService = new AdminService();
