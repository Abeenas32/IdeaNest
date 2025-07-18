import { ApiResponse } from './../types/api.types';
import { Response } from 'express';


//  this utility function makes the response object consistent across the application

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
        timestamp: new Date().toDateString()
    };
    return res.sendStatus(statusCode).json(response);

}

 export const sendError = ( res : Response,
    message : string  = ' Internal server error',
    statuscode  : number = 500,
    error ? : string
 ) : Response => {
      const response  : ApiResponse = {
         
        success : false,
        message ,
         error : error || message ,
         timestamp : new Date().toDateString(),
        
      }
       return res.sendStatus(statuscode).json(response);
 }
  export const sendValidationError = ( res :Response,
     errors : any,
     message : string = 'Validation Error',

  ) : Response  => {
     
    return sendError(res, message , 400, errors);
  }
