import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, refreshTokens, logoutUser, logoutAllDevices } from '../services/auth.services';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../types/auth.types';
import { config } from '../config/environment.config';
import { User } from '../models/User.model';
 
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await registerUser(req.body);
    
    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, config.cookies);
    
    sendSuccess(res, {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      accessToken: tokens.accessToken
    }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await loginUser(req.body);
    
    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, config.cookies);
    
    sendSuccess(res, {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      accessToken: tokens.accessToken
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      sendError(res, 'Refresh token is required', 401);
      return;
    }
    
    const tokens = await refreshTokens(refreshToken);
    
    // Set new refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, config.cookies);
    
    sendSuccess(res, {
      accessToken: tokens.accessToken
    }, 'Tokens refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken || !req.user) {
      sendError(res, 'Invalid request', 400);
      return;
    }
    
    await logoutUser(req.user.userId, refreshToken);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    
    await logoutAllDevices(req.user.userId);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    sendSuccess(res, null, 'Logged out from all devices');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    
    sendSuccess(res, {
      id: user._id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};