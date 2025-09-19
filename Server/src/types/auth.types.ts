import { Request } from 'express';

export interface TokenPayload {
  userId: string; 
  email: string;
  role?: 'user' | 'admin' | 'moderator';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface  AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string; 
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  totalIdeas: number;
  totalLikes: number;
}

export interface AdminStats {
  totalUsers: number;
  totalIdeas: number;
  totalLikes: number;
  activeUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  moderatorUsers: number;
  ideasThisMonth: number;
  likesThisMonth: number;
}