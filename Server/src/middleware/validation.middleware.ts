import {  Request,Response, NextFunction } from 'express';
import { ZodSchema, ZodError} from 'zod';
import { sendValidationError } from '../utils/response.utils';
import { sanitizeInput } from '../utils/sanitize.util';
  
export const validate = (schema : ZodSchema) => {
     return (req:Request, res:Response, next: NextFunction) :void => {
          try {
            // sanitize input before zod validation
            const sanitizedBody = sanitizeInput(req.body);
            const sanitizedQuery = sanitizeInput(req.query);
            const sanitizedParams = sanitizeInput(req.params);

            //   now validate the sanitized input and  setting pure and validated req for error handling 

             const validatedBody = schema.parse(sanitizedBody);
             req.body = validatedBody;
             req.query = sanitizedQuery;
             req.params = sanitizedParams;

             next();
          } catch (error) {
            if(error instanceof ZodError){
                const formattedError = error.issues.map(err => ({
                    field : err.path.join('.'),
                    message: err.message,
                    code: err.code,

                }))
                sendValidationError(res, formattedError, 'Validation Failed')
            }
            else{
                sendValidationError(res, 'Invalid input data');
            }
              
          }
     }
}
