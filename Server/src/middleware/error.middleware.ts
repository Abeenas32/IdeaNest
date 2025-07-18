import { sendError } from '../utils/response.utils';
import { ApiError } from './../types/api.types';
import { Request, Response, NextFunction } from 'express';


export const errorHandler = (error: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', error);
    let statusCode = 500;
    let message = 'Internal Server Error';

    if ('statusCode' in error) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if ( error.name === 'Validation Error '){
        statusCode = 400;
    }
    else if (error.name === 'CastError'){
 statusCode =  400;
 message = 'Invalid Id Format'
    }
     else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  const errorDetails = process.env.NODE_ENV === 'production' ? undefined : error.stack;
  sendError(res, message , statusCode, errorDetails);

}
 export const notFoundHandler = (req : Request , res: Response ): void => {
    sendError(res, `Route ${req.originalUrl} not found`, 404);
 }