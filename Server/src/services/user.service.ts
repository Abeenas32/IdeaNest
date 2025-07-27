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

    //   async updateProfile (userId: string, updateData: Partial<IUser>) : Promise<UserProfile | null >  {
    //       try {
    //         const updatedUser = await User.findByIdAndUpdate(userId,  {
    //              ...updateData,
    //              updatedAt: new Date()
    //         },
    //     { new :true}).select('-password');
    //     if(!updatedUser) {
    //          return null;
    //     }
        
    //       } catch (error) {
            
    //       }
    //   }


}



