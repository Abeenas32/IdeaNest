import { Request } from 'express';

export interface TokenPayload {
  userId: string; 
  email: string;
  role ?: 'user' | 'admin';
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

export interface AuthenticatedRequest extends Request {
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