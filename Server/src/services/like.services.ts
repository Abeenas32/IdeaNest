import { ILike } from './../types/like.types';
import mongoose from 'mongoose';
import { Like } from '../models/like.model';
import { Idea } from '../models/Idea.models';
import { generateFingerprint } from '../utils/fingerprint.utils';
import { LikeServiceData, LikeResult } from '../types/like.types';
export class LikeService {
  /**
   * Toggle like status for an idea
   */
  async toggleLike(data: LikeServiceData): Promise<LikeResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { ideaId, userId, ipAddress, userAgent } = data;

      // Validate idea exists
      const idea = await Idea.findById(ideaId).session(session);
      if (!idea) {
        await session.abortTransaction();
        return {
          success: false,
          liked: false,
          likeCount: 0,
          message: 'Idea not found'
        };
      }

      let query: any = { ideaId: new mongoose.Types.ObjectId(ideaId) };
      let likeData: Partial<ILike> = {
        ideaId: new mongoose.Types.ObjectId(ideaId),
        ipAddress,
        userAgent
      };

      // Set query and data based on user authentication
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
        likeData.userId = new mongoose.Types.ObjectId(userId);
      } else {
        const fingerprint = generateFingerprint(ipAddress, userAgent);
        query.fingerprint = fingerprint;
        likeData.fingerprint = fingerprint;
      }

      // Check if like already exists
      const existingLike = await Like.findOne(query).session(session);

      let liked: boolean;
      let likeCountChange: number;

      if (existingLike) {
        // Unlike: Remove the like
        await Like.deleteOne({ _id: existingLike._id }).session(session);
        liked = false;
        likeCountChange = -1;
      } else {
        // Like: Create new like
        await Like.create([likeData], { session });
        liked = true;
        likeCountChange = 1;
      }

      // Update idea like count atomically
      const updatedIdea = await Idea.findByIdAndUpdate(
        ideaId,
        { $inc: { likeCount: likeCountChange } },
        { new: true, session }
      );

      await session.commitTransaction();

      return {
        success: true,
        liked,
        likeCount: updatedIdea?.likeCount || 0
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Error toggling like:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return {
          success: false,
          liked: false,
          likeCount: 0,
          message: 'Like operation failed due to concurrent request'
        };
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get like status for a user/IP on an idea
   */
  async getLikeStatus(ideaId: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    try {
      let query: any = { ideaId: new mongoose.Types.ObjectId(ideaId) };

      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
      } else if (ipAddress && userAgent) {
        const fingerprint = generateFingerprint(ipAddress, userAgent);
        query.fingerprint = fingerprint;
      } else {
        return false;
      }

      const like = await Like.findOne(query);
      return !!like;
    } catch (error) {
      console.error('Error getting like status:', error);
      return false;
    }
  }

  /**
   * Get total likes count for an idea
   */
  async getLikeCount(ideaId: string): Promise<number> {
    try {
      return await Like.countDocuments({ ideaId: new mongoose.Types.ObjectId(ideaId) });
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  }

  /**
   * Get ideas liked by a user (for authenticated users only)
   */
  async getUserLikedIdeas(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const likes = await Like.find({ userId: new mongoose.Types.ObjectId(userId) })
        .populate({
          path: 'ideaId',
          model: 'Idea',
          select: 'title content tags likeCount createdAt authorName isAnonymous'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Like.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });

      return {
        ideas: likes.map(like => like.ideaId).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user liked ideas:', error);
      return {
        ideas: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Clean up old anonymous likes (for maintenance)
   */
  async cleanupOldAnonymousLikes(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Like.deleteMany({
        fingerprint: { $ne: null },
        userId: null,
        createdAt: { $lt: cutoffDate }
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up old anonymous likes:', error);
      return 0;
    }
  }
}