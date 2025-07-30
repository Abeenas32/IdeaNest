import { UserService } from '@/services/user.service';
import { sendError, sendSuccess } from '@/utils/response.utils';
import { Request, Response } from 'express';
import { parse } from 'path';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  }
}
export class UserController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }
      const profile = await this.userService.getUserProfile(userId);
      if (!profile) {
        return sendError(res, 'User profile not found', 400);
      }
      return sendSuccess(res, profile, 'Profile Retrieved Successfully');
    } catch (error) {
      console.error('Error in getProfile:', error);
      return sendError(res, 'Failed to retrieve profile', 500);
    }
  }

  getPublicProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 'Invalid UserId provided', 400)
      }
      const profile = await this.userService.getPublicProfile(userId);
      if (!profile) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, profile, 'Profile Retrieved Successfully', 200);
    } catch (error) {
      console.error('Error in getting the public profile', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
  getUserIdeas = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 'Invalid user ID format', 400);
      }
      if (page < 1 || limit < 1) {
        return sendError(res, 'Invalid pagination parameters', 400);
      }
      const result = await this.userService.getUserIdea(userId, page, limit);
      // don't use the if condition here cuz user may havent posted the ideas in that scenario 
      return sendSuccess(res, {
        ideas: result.ideas,
        pagination: result.pagination
      }, 'User retrieved successfully');

    } catch (error) {
      console.error('Errror in getting user Ideas', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  getLikedIdeas = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Authentication error', 401);
      }
      const page = parseInt(req.query.page as string);
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      if (page < 1 || limit < 1) {
        return sendError(res, 'Invalid Pagination parameters', 400);
      }
      const result = await this.userService.getLikedIdeas(userId, page, limit);
      return sendSuccess(res, {
        ideas: result.ideas,
        pagination: result.pagination
      }, 'Liked Ideas Retrieved Successfully');
    } catch (error) {
      console.log('Error in getting the liked ideas');
      return sendError(res, 'Internal Server Error', 500);
    }
  }
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }
      const updateData = req.body;
      const allowedFields = ['name', 'bio', 'avatar'];
      const filteredData: any = {};
      for (const fields of allowedFields) {
        if (updateData[fields] !== undefined) {
          filteredData[fields] = updateData[fields];
        }
      }
      if (Object.keys(filteredData).length === 0) {
        return sendError(res, 'No valid fields to update', 400);
      }
      const updatedProfile = await this.userService.updateProfile(userId, filteredData);
      if (!updatedProfile) {
        return sendError(res, 'Failed to update profile', 400);
      }
      return sendSuccess(res, updatedProfile, 'Profile updated Successfully');
    } catch (error) {
      console.error('Error in updateProfile', error);
      return sendError(res, 'Internal Server Error', 500);
    }
  }
  getUserStats = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 'Invalid userId provided', 400);
      }
      const stats = await this.userService.getUserStats(userId);
      if (!stats) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, stats, 'User statistics retrived successfully')
    } catch (error) {
      console.error('error in getting user stats', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
  deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }
      const { confirmPassword } = req.body;
      if (!confirmPassword) {
        return sendError(res, 'Password confirmation required', 400);
      }
      const result = await this.userService.deleteAccount(userId, confirmPassword);
      if (!result.success) {
        return sendError(res, result.message || ' Failed to delete account', 400)
      }
      return sendSuccess(res, {}, 'Account deleted Successfully');
    } catch (error) {
      console.error('Error in deleteAccount', error);
      return sendError(res, 'Internal Server Error', 500);
    }
  }


  getUserActivity = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, 'Invalid Pagination params', 400);
      }
      const result = await this.userService.getUserActivity(userId, page, limit);
      return sendSuccess(res, {
        activities: result.activities,
        pagination: result.pagination,
      }, 'User activity retrieved successfully', 200
      )
    } catch (error) {
      console.error('Error in getting user activity', error);
      return sendError(res, 'Internal Server Error', 500);

    }
  }

  searchUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { q: searchTerm } = req.query as { q: string };
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      if (!searchTerm || searchTerm.trim().length < 2) {
        return sendError(res, 'Search term must be at least 2 characters', 400);
      }
      if (page < 1 || limit < 1) {
        return sendError(res, 'Invalid pagination params', 400);
      }

      const result = await this.userService.searchUsers(searchTerm.trim(), page, limit);
      return sendSuccess(res, {
        users: result.users,
        pagination: result.pagination,
      }, 'Users search completed');
    } catch (error) {
      console.error('Error in searchUsers', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
}

 export const userController = new UserController();



