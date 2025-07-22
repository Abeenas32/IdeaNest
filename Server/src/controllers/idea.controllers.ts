import { Idea } from '../models/Idea.models';
// import { createIdea } from './../services/idea.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { sendError, sendSuccess } from '../utils/response.utils';
import {Request, Response , NextFunction } from 'express';
import { ideaService } from '../services/idea.service';
import { send } from 'process';

class IdeaController {
  createIdea = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, tags } = req.body;
      const userId = req.user?.userId;
      const ideaData = {
                 title, 
                 content,
                 tags,
                 authorId : userId , 
                 authorType : userId ? 'authenticated' as const : 'anonymous' as const 
              }
              const idea = await ideaService.createIdea(ideaData, req);
              sendSuccess(res,
                     { idea:{
                    _id : idea._id,
                    title : idea.title,
                    content : idea.content,
                    tags : idea.tags,
                    authorTpye : idea.authorType,
                    createdAt : idea.createdAt,
                }},'Idea created Successfylly');
          } catch (error) {
            next(error);
          }
     }
async getIdeas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page,
        limit,
        search,
        tags,
        sortBy,
        sortOrder,
        authorType
      } = req.query as any;

      const filters = {
        search,
        tags,
        sortBy,
        sortOrder,
        authorType
      };

      const pagination = { page: Number(page), limit: Number(limit) };
      
      const result = await ideaService.getIdeas(filters, pagination);
      
        sendSuccess(res, result, 'Ideas retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getIdeaById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const idea = await ideaService.getIdeaById(id, true);
      
      if (!idea) {
        sendError(res, 'Idea not found', 404);
        return;
      }

      sendSuccess(res, { idea }, 'Idea retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateIdea(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, tags } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, 'Authentication required to update idea', 401);
        return;
      }

      const updateData = { title, content, tags };
      const updatedIdea = await ideaService.updateIdea(id, updateData, userId);

      if (!updatedIdea) {
        sendError(res, 'Idea not found or unauthorized', 404);
        return;
      }

      sendSuccess(res, { idea: updatedIdea }, 'Idea updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteIdea(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, 'Authentication required to delete idea', 401);
        return;
      }

      const isDeleted = await ideaService.deleteIdea(id, userId);

      if (!isDeleted) {
        sendError(res, 'Idea not found or unauthorized', 404);
        return;
      }

      sendSuccess(res, null, 'Idea deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserIdeas(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10 } = req.query as any;

      if (!userId) {
        sendError(res, 'Authentication required to get user ideas', 401);
        return;
      }

      const pagination = { page: Number(page), limit: Number(limit) };
      const result = await ideaService.getUserIdeas(userId, pagination);

      sendSuccess(res, result, 'User ideas retrieved successfully');
    } catch (error) {
      next(error);
    }
  }


    } 

 export const ideaController = new IdeaController();
    
    