import { PublicProfile, UserStats, UserActivity, UserProfile } from './../types/user.types';
import { Idea } from "@/models/Idea.models";
import { Like } from "@/models/like.model";
import { User, IUser } from "@/models/User.model";
import mongoose from "mongoose";
import { CacheService } from "./cache.service";
import { verifyPassword } from "@/utils/password.utils";


export class UserService {
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const cacheKey = `profile:${userId}`;
            const cahcedProfile = await CacheService.get<UserProfile>(cacheKey);
            if (cahcedProfile) {
                return cahcedProfile;
            }
            const user = await User.findById(userId).select('-password');
            if (!user) {
                return null;
            }
            const [totalIdeas, totalLikes] = await Promise.all([
                Idea.countDocuments({ authorId: userId }),
                Like.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })]);
            const profile: UserProfile = {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                bio: user.bio,
                avatar: user.avatar,
                createdAt: user.createdAt,
                totalIdeas,
                totalLikes,
                isActive: user.isActive
            }
            //  cahced for one hour 
            await CacheService.set(cacheKey, profile, { ttl: 300 });
            return profile;
        } catch (error) {
            console.error('Error getting the user profile', error);
            return null;
        }
    }
    async getPublicProfile(userId: string): Promise<PublicProfile | null> {
        try {
            const cacheKey = `public:profile:${userId}`;
            const cachedProfile = await CacheService.get<PublicProfile>(cacheKey);
            if (cachedProfile) {
                return cachedProfile;

            }
            const user = await User.findById(userId).select('name bio avatar createdAt');
            if (!user) {
                return null;
            }
            const [totalIdeas, totalLikes] = await Promise.all([
                Idea.countDocuments({ authorId: userId }),
                Like.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })
            ]);
            const publicProfile: PublicProfile = {
                id: user.id.toString(),
                name: user.name,
                bio: user.bio,
                avatar: user.avatar,
                createdAt: user.createdAt,
                totalIdeas,
                totalLikes
            }
            await CacheService.set(cacheKey, publicProfile, { ttl: 600 });
            return publicProfile;
        } catch (error) {
            console.error('Error getting public profile', error);
            return null;

        }
    }

    //  get user's ideas  do not get confused
    async getUserIdea(userId: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const [ideas, total] = await Promise.all([
                Idea.find({ authorId: userId })
                    .select('title content tags likeCount createdAt updatedAt')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Idea.countDocuments({ authorId: userId })
            ])
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
            }
        } catch (error) {
            console.error('Error in getting the user ideas :', error);
            return {
                ideas: [],
                pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
            }

        }
    }
    //  get user's liked ideas with pagination 
     async getLikedIdeas(userId : string, page : number = 1, limit : number = 1) { 
        try {
            const skip  = (page -1) * limit;
            const [likes , total] = await Promise.all([
                Like.find({userId : new mongoose.Types.ObjectId(userId)})
                    .populate({
                         path : 'ideaId',
                         model : 'Idea',
                         select : 'title content tags likeCount createdAt authorName isAnonymous'
                    })
                    .sort({createdAt : -1})
                    .limit(limit)
                    .lean(),
                    Like.countDocuments({ userId : new mongoose.Types.ObjectId(userId)})
            ]);
            const ideas = likes.map(like => like.ideaId).filter(Boolean);
             return  {
                  ideas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }  
    }  
        } catch (error) {
             console.error('Error gettinf liked ideas : ', error);
             return {
                 ideas : [],
                 pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
             }
        }
     }

     async updateProfile(userId: string, updateData: Partial<IUser>): Promise<UserProfile | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return null;
      }

      // Clear cached profile
      await CacheService.delete(`profile:${userId}`);
      await CacheService.delete(`public:profile:${userId}`);

      // Get updated statistics
      const [totalIdeas, totalLikes] = await Promise.all([
        Idea.countDocuments({ authorId: userId }),
        Like.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })
      ]);

      const profile: UserProfile = {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        totalIdeas,
        totalLikes,
        isActive: updatedUser.isActive
      };

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  /**
   * Get detailed user statistics
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      // Check cache first
      const cacheKey = `stats:${userId}`;
      const cachedStats = await CacheService.get<UserStats>(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }

      const user = await User.findById(userId).select('name createdAt');
      if (!user) {
        return null;
      }

      // Date calculations
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Parallel aggregations for better performance
      const [
        totalIdeas,
        totalLikes,
        totalLikesReceived,
        ideasThisMonth,
        likesThisMonth,
        topTags
      ] = await Promise.all([
        // Total ideas posted
        Idea.countDocuments({ authorId: userId }),
        
        // Total likes given
        Like.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
        
        // Total likes received on user's ideas
        Idea.aggregate([
          { $match: { authorId: userId } },
          { $group: { _id: null, totalLikes: { $sum: '$likeCount' } } }
        ]).then(result => result[0]?.totalLikes || 0),
        
        // Ideas posted this month
        Idea.countDocuments({ 
          authorId: userId,
          createdAt: { $gte: startOfMonth }
        }),
        
        // Likes given this month
        Like.countDocuments({ 
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth }
        }),
        
        // Top tags used by user
        Idea.aggregate([
          { $match: { authorId: userId } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { tag: '$_id', count: 1, _id: 0 } }
        ])
      ]);

      const stats: UserStats = {
        id: user.id.toString(),
        name: user.name,
        totalIdeas,
        totalLikes,
        totalLikesReceived,
        ideasThisMonth,
        likesThisMonth,
        topTags,
        joinedAt: user.createdAt
      };

      // Cache stats for 30 minutes
      await CacheService.set(cacheKey, stats, { ttl: 1800 });

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string, confirmPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify password
      const isPasswordValid = await verifyPassword(confirmPassword, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid password' };
      }

      // Soft delete - mark as inactive and anonymize data
      await User.findByIdAndUpdate(userId, {
        isActive: false,
        email: `deleted_${userId}@deleted.com`,
        name: 'Deleted User',
        bio: null,
        avatar: null,
        deletedAt: new Date()
      });

      // Anonymize user's ideas
      await Idea.updateMany(
        { authorId: userId },
        { 
          authorName: 'Deleted User',
          isAnonymous: true
        }
      );

      // Clear all cached data
      await Promise.all([
        CacheService.delete(`profile:${userId}`),
        CacheService.delete(`public:profile:${userId}`),
        CacheService.delete(`stats:${userId}`),
        CacheService.delete(`session:${userId}`)
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { success: false, message: 'Failed to delete account' };
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivity(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get recent ideas and likes
      const [recentIdeas, recentLikes] = await Promise.all([
        Idea.find({ authorId: userId })
          .select('_id title createdAt updatedAt')
          .sort({ updatedAt: -1 })
          .limit(limit)
          .lean(),
        
        Like.find({ userId: new mongoose.Types.ObjectId(userId) })
          .populate({
            path: 'ideaId',
            select: 'id title'
          })
          .select('ideaId createdAt')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean()
      ]);

      // Combine and sort activities
      const activities: UserActivity[] = [];

      // Add idea activities
      recentIdeas.forEach(idea => {
        activities.push({
          type: 'idea_created',
          ideaId: idea._id.toString(),
          ideaTitle: idea.title,
          timestamp: idea.createdAt
        });

        // If updated after creation, add update activity
        if (idea.updatedAt && idea.updatedAt > idea.createdAt) {
          activities.push({
            type: 'idea_updated',
            ideaId: idea._id.toString(),
            ideaTitle: idea.title,
            timestamp: idea.updatedAt
          });
        }
      });

      // Add like activities
      recentLikes.forEach(like => {
        if (like.ideaId) {
          activities.push({
            type: 'idea_liked',
            ideaId: like.ideaId.id.toString(),
            ideaTitle: like.ideaId.title,
            timestamp: like.createdAt
          });
        }
      });

      // Sort by timestamp and paginate
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(skip, skip + limit);

      return {
        activities: sortedActivities,
        pagination: {
          page,
          limit,
          total: activities.length,
          totalPages: Math.ceil(activities.length / limit),
          hasNext: page < Math.ceil(activities.length / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return {
        activities: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
      };
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const searchRegex = new RegExp(searchTerm, 'i');
      const searchQuery = {
        isActive: true,
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ]
      };

      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select('name email avatar createdAt')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(searchQuery)
      ]);

      // Get user statistics for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [totalIdeas, totalLikes] = await Promise.all([
            Idea.countDocuments({ authorId: user._id }),
            Idea.aggregate([
              { $match: { authorId: user._id.toString() } },
              { $group: { _id: null, totalLikes: { $sum: '$likeCount' } } }
            ]).then(result => result[0]?.totalLikes || 0)
          ]);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt,
            totalIdeas,
            totalLikesReceived: totalLikes
          };
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
      console.error('Error searching users:', error);
      return {
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
      };
    }
  }

  /**
   * Get user recommendations based on similar interests
   */
  async getUserRecommendations(userId: string, limit: number = 10) {
    try {
      // Get user's top tags
      const userTags = await Idea.aggregate([
        { $match: { authorId: userId } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $group: { _id: null, tags: { $push: '$_id' } } }
      ]);

      if (!userTags.length || !userTags[0].tags.length) {
        return [];
      }

      const tags = userTags[0].tags;

      // Find users with similar interests
      const recommendations = await User.aggregate([
        // Match users who posted ideas with similar tags
        {
          $lookup: {
            from: 'ideas',
            localField: '_id',
            foreignField: 'authorId',
            as: 'ideas'
          }
        },
        {
          $match: {
            _id: { $ne: new mongoose.Types.ObjectId(userId) },
            isActive: true,
            'ideas.tags': { $in: tags }
          }
        },
        // Calculate similarity score
        {
          $addFields: {
            commonTags: {
              $size: {
                $setIntersection: [
                  { $reduce: {
                    input: '$ideas.tags',
                    initialValue: [],
                    in: { $setUnion: ['$value', '$this'] }
                  }},
                  tags
                ]
              }
            },
            totalIdeas: { $size: '$ideas' }
          }
        },
        {
          $addFields: {
            score: { $multiply: ['$commonTags', '$totalIdeas'] }
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            createdAt: 1,
            totalIdeas: 1,
            commonTags: 1,
            score: 1
          }
        }
      ]);

      return recommendations;
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      return [];
    }
  }
     


}



