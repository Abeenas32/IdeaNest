// import { createIdea } from './../services/idea.service';
import { AuthenticatedRequest } from './../types/auth.types';
import { sendError, sendSuccess } from './../utils/response.utils';
import {Request, Response , NextFunction } from 'express';
import { ideaService } from '../services/idea.service';
     
 class  IdeaContorller {
      createIdea = async (req:Request , res : Response , next : NextFunction) : Promise<void> => {
         
     }
 }