import { AuthenticatedRequest } from './../types/auth.types';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessTokens, extractToken } from '../utils/jwt.utils';
import { sendError } from '../utils/response.utils';
import { DecodedToken } from '../types/idea.types';
import jwt from 'jsonwebtoken';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    if (!token) {
      sendError(res, 'Access token is required', 401);
      return;
    }
    // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as DecodedToken;
    const payload = verifyAccessTokens(token)
    req.user = payload;
    next();
  } catch (error) {
    sendError(res, 'Invalid or Expired access token', 401);
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication failed', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Invalid Permission', 403);
      return;
    }
    next();
  }
}

// for the guest user cuz they don't have the token 
//  required 
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (token) {
      const payload = verifyAccessTokens(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth for guest. 
    next();
  }
};