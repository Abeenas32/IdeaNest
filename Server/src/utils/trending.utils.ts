import { Idea } from "../models/Idea.models";

export interface TrendingScore {
    ideaId: string;
    score: number;
    likeCount: number;
    createdAt: Date;

}
export interface TrendingOptions {
    timeWindow?: number;
    decayFactor?: number;
    minLikes?: number;
    limit?: number;

}

export class TrendingUtils {
    private static readonly DEFAULT_OPTIONS: Required<TrendingOptions> = {
        timeWindow: 24,
        decayFactor: 0.8,
        minLikes: 1,
        limit: 20
    };


    static calculateTrendingScore(likeCount: number,
        createdAt: Date,
        options: Partial<TrendingOptions> = {}): number {
        const opts = {
            ...this.DEFAULT_OPTIONS, ...options
        }
        const now = new Date();
        const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursOld > opts.timeWindow) {
            return 0;
        }
         const timeDecay = Math.pow(opts.decayFactor, hoursOld);
         const baseScore = likeCount * timeDecay;
         const newPostBoost = hoursOld < 2 ? 1.3 : 1.0 ;
          return baseScore * newPostBoost;
    }
     static async getTrendingIdeas(options : Partial<TrendingOptions> = {}) : Promise<any[]> {
         const opts = {
             ...this.DEFAULT_OPTIONS, ...options
     };
 const timeWindows = opts.timeWindow *60*60*1000;
 const cutoffTime = new Date(Date.now() - timeWindows);
 try {
      const pipeline = [
        // Filter ideas within time window and with minimum likes
        {
          $match: {
            createdAt: { $gte: cutoffTime },
            likeCount: { $gte: opts.minLikes }
          }
        },
        
        // Add trending score calculation
        {
          $addFields: {
            hoursOld: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        },
        
        // Calculate trending score
        {
          $addFields: {
            timeDecay: {
              $pow: [opts.decayFactor, '$hoursOld']
            }
          }
        },
        
        // Apply new post boost and final score
        {
          $addFields: {
            newPostBoost: {
              $cond: {
                if: { $lt: ['$hoursOld', 2] },
                then: 1.2,
                else: 1.0
              }
            },
            trendingScore: {
              $multiply: [
                '$likeCount',
                '$timeDecay',
                '$newPostBoost'
              ]
            }
          }
        },
        
        // Sort by trending score (highest first)
        { $sort: { trendingScore: -1 as -1 | 1} },
        
        // Limit results
        { $limit: opts.limit },
        
        // Select fields to return
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            tags: 1,
            authorName: 1,
            isAnonymous: 1,
            likeCount: 1,
            createdAt: 1,
            updatedAt: 1,
            trendingScore: 1,
            hoursOld: 1
          }
        }
      ];

      return await Idea.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting trending ideas:', error);
      return [];
    }
  
    }
    static async getTopIdeas(
    timeframe: 'day' | 'week' | 'month' | 'all' = 'day',
    limit: number = 20
  ): Promise<any[]> {
    try {
      let matchStage: any = {};
      
      // Set time filter based on timeframe
      if (timeframe !== 'all') {
        const timeMap = {
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000
        };
        
        const cutoffTime = new Date(Date.now() - timeMap[timeframe]);
        matchStage.createdAt = { $gte: cutoffTime };
      }

      const pipeline = [
        { $match: matchStage },
        
        // Sort by like count (highest first), then by creation date (newest first)
        { $sort: { likeCount: -1 as -1, createdAt: -1 as -1  } },
        
        // Limit results
        { $limit: limit },
        
        // Select fields to return
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            tags: 1,
            authorName: 1,
            isAnonymous: 1,
            likeCount: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ];

      return await Idea.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting top ideas:', error);
      return [];
    }
  }

  /**
   * Get trending tags based on recent idea activity
   */
  static async getTrendingTags(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const pipeline = [
        // Filter recent ideas with likes
        {
          $match: {
            createdAt: { $gte: last24Hours },
            likeCount: { $gt: 0 },
            tags: { $exists: true, $ne: [] }
          }
        },
        
        // Unwind tags array
        { $unwind: '$tags' },
        
        // Group by tag and sum weighted counts (like count as weight)
        {
          $group: {
            _id: '$tags',
            count: { $sum: '$likeCount' },
            ideaCount: { $sum: 1 }
          }
        },
        
        // Sort by weighted count
        { $sort: { count: -1 as -1 } },
        
        // Limit results
        { $limit: limit },
        
        // Format output
        {
          $project: {
            _id: 0,
            tag: '$_id',
            count: 1,
            ideaCount: 1
          }
        }
      ];

      return await Idea.aggregate(pipeline);
    } catch (error) {
      console.error('Error getting trending tags:', error);
      return [];
    }
  }

  /**
   * Batch update trending scores (for background jobs)
   */
  static async updateTrendingScores(options: Partial<TrendingOptions> = {}): Promise<number> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const timeWindowMs = opts.timeWindow * 60 * 60 * 1000;
      const cutoffTime = new Date(Date.now() - timeWindowMs);

      const ideas = await Idea.find({
        createdAt: { $gte: cutoffTime },
        likeCount: { $gte: opts.minLikes }
      }).select('_id likeCount createdAt');

      let updatedCount = 0;

      for (const idea of ideas) {
        const score = this.calculateTrendingScore(
          idea.likeCount,
          idea.createdAt,
          options
        );

        await Idea.updateOne(
          { _id: idea._id },
          { $set: { trendingScore: score } }
        );

        updatedCount++;
      }

      return updatedCount;
    } catch (error) {
      console.error('Error updating trending scores:', error);
      return 0;
    }
  }
}