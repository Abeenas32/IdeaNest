import { ILike, LikeServiceData, LikeResult } from './../types/like.types';
import { Like } from "../models/like.model";
import { sendError } from '../utils/response.utils';
import mongoose from 'mongoose';
import { Idea } from '../models/Idea.models'
import { generateAnonymousFingerPrint } from '../utils/fingerprint.utils';


export class LikeService {
    async toggleLike(data: LikeServiceData): Promise<LikeResult> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { ideaId, userId, ipAddress, userAgent } = data;
            const idea = await Idea.findById(ideaId).session(session);
            if (!idea) {
                await session.abortTransaction();
                return {
                    success: false,
                    liked: false,
                    likeCount: 0,
                    message: 'Idea notfound'
                };
            }
            let query: any = { ideId: new mongoose.Types.ObjectId(ideaId) };
            let likeData: Partial<ILike> = {
                ideaId: new mongoose.Types.ObjectId(ideaId),
                ipAddress,
                userAgent
            };
            if (userId) {
                query.userId = new mongoose.Types.ObjectId(userId);
                likeData.userId = new mongoose.Types.ObjectId(userId);
            }
            else {
                // Create a mock request object with required properties for fingerprint generation
                const mockReq = {
                    ip: data.ipAddress,
                    headers: {
                        'user-agent': data.userAgent
                    }
                } as any;
                const fingerprint = generateAnonymousFingerPrint(mockReq);
                query.fingerprint = fingerprint;
                likeData.fingerprint = fingerprint;
            }
            const existingLike = await Like.findOne(query).session(session);
            let liked: boolean;
            let likeCountChange: number;

            if (existingLike) {
                await Like.deleteOne({ _id: existingLike._id }).session(session);
                liked = false;
                likeCountChange = -1;
            }
            else {
                await Like.create([likeData], { session })
                liked = true;
                likeCountChange = 1;
            }
            const updateIdea = await Idea.findByIdAndUpdate(ideaId, {
                $winc: {
                    likecount: likeCountChange
                }
            },
                { new: true, session }
            );
            await session.commitTransaction();
            return {
                success: true,
                liked,
                likeCount: updateIdea?.likeCount || 0
            }
        } catch (error) {
            await session.abortTransaction();
            console.error('Error toggling like', error);
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
}