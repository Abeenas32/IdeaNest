// import { getProfile } from './auth.controller';
// import { AuthenticatedRequest } from './../types/auth.types';
import { UserService } from '@/services/user.service';
import { sendError, sendSuccess } from '@/utils/response.utils';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    }
}



 export class UserController {
      private userService  : UserService;
       constructor () {
         this.userService = new UserService();
       }

       getProfile  = async (req:AuthenticatedRequest , res :Response) : Promise<Response>   {
        try {
             const userId = req.user?.id ;
           if(!userId) {
             return sendError(res, 'Authentication required', 401);
           }
           const profile = await this.userService.getUserProfile(userId);
           if(!profile){
            return sendError(res, 'User profile not found', 400);
           }
           return sendSuccess(res,profile,'Profile Retrived Successfully');
        } catch (error) {
            
        }
         
       }
 }


