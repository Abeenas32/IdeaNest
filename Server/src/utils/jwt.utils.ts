import { AuthTokens, TokenPayload } from './../types/auth.types';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.config';

export const generateAccessTokens = (
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): string => {
  try {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    } as jwt.SignOptions);

  } catch (error) {
    // console.error('Failed to generate access token:', error);
    throw new Error('Access token generation failed');
  }
};

export const generateRefreshToken = (
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): string => {
  try {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    } as jwt.SignOptions);

  } catch (error) {
    throw new Error("Error in generating the RefreshTokens");
  }
};

export const generateTokens = (payload: Omit<TokenPayload, 'iat' | 'exp'>): AuthTokens => {
  return {
    accessToken: generateAccessTokens(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyAccessTokens = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid Refresh Token");
  }
};


export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as TokenPayload
  } catch (error) {
    throw new Error("Invalid refresh token");

  }

}

export const extractToken =  (authHeader : string | undefined ) : string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer')){

      return null;
    }
     return authHeader.substring(7);
}