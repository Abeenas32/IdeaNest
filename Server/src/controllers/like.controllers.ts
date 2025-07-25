// import { AuthenticatedRequest } from './../types/auth.types';
import { Request, Response, NextFunction } from 'express';
import { LikeService } from '../services/like.services';
import { sendError, sendSuccess } from '../utils/response.utils';


interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    }
}

export class LikeController {
    private likeService: LikeService;
    constructor() {
        this.likeService = new LikeService();
    }
    toogleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { ideaId } = req.params;
            const userId = req.user?.id;
            //  const ipAddress = req.ip;
            const userAgent = req.headers['user-agent'] as string;

            if (!ideaId || !ideaId.match(/^[0-9a-fA-F]{24}$/)) {
                sendError(res, 'Invalid idea Id format', 400);
            }
            const ipAddress: string = req.ip || '';
            const result = await this.likeService.toggleLike({ ideaId, userId, ipAddress, userAgent });
            if (!result.success) {
                sendError(res, 'Failed to toggle like', 500);
            } else {
                sendSuccess(res, {
                    liked: result.liked,
                    likeCount: result.likeCount,
                    action: result.liked ? 'liked' : 'unliked'
                }, 'Like toggled successfully', 200);
            }
        } catch (error) {
            console.error('error in toggleLike', error);
            sendError(res, 'Internal server error', 500);
        }
    }

     getUserLikedIdeas = async(req : AuthenticatedRequest, res : Response) : Promise <void>  =>  {
         try {
    const userId = req.user?.id;
    if (!userId || typeof userId !== 'string') {
        sendError(res, 'Authentication required', 401);
        return;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    if (page < 1 || limit < 1) {
        sendError(res, 'Invalid pagination parameters', 400);
        return; // <-- Add return here
    }
    const result = await this.likeService.getUserLikedIdeas(userId, page, limit);
    sendSuccess(res, result, 'Fetched liked ideas', 200); // <-- Send result to client
} catch (error) {
    console.error('Error in getUserLikedIdeas:', error);
    sendError(res, 'Internal server error', 500); // <-- Handle errors
}
     }

      getLikeCount = async (req: Request, res :Response) : Promise<void> =>  {
         try {
            const {ideaId } = req.params;
            if(!ideaId) {
                 sendError(res, 'Invalid ideaId format provided', 400);
            }
            const likeCount = await this.likeService.getLikeCount(ideaId);
            sendSuccess(res, {likeCount}, 'Like count retrieved');
         } catch (error) {
            console.log('error in getting the likeCount', error);
            sendError(res, 'Internl Server Error', 500);
         }
      }   
      getLikeStatus = async(req:AuthenticatedRequest, res:Response ) : Promise<void> => {
        try {
            const { ideaId } = req.params;
            const userId = req.user?.id;
            const userAgent = req.headers['user-agent'] as string | undefined;

             if(!ideaId || !ideaId.match(/^[0-9a-fA-F]{24}$/)) {
                sendError(res,'Invalid idea ID format', 400);
             }
              const [isLiked, likeCount]  = await Promise.all([
                this.likeService.getLikeStatus(ideaId, userId,req?.ip,userAgent),
                this.likeService.getLikeCount(ideaId) 
              ])
               sendSuccess(res, {isLiked,likeCount}, 'Like Status Retrived');

        } catch (error) {
            console.error("error in getting like status:", error);
            sendError(res, 'Internal Server Error', 500);
            
        }
       }
}
 export const likeController = new LikeController();

