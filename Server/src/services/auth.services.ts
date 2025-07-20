import { User, IUser } from '../models/User.model';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.utils';
import { LoginCredentials, RegisterCredentials, AuthTokens, TokenPayload } from '../types/auth.types';

export const registerUser = async (credentials: RegisterCredentials): Promise<{ user: IUser; tokens: AuthTokens }> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: credentials.email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }
  
  // Create new user
  const user = new User({
    email: credentials.email,
    password: credentials.password
  });
  
  await user.save();
  
  // Generate tokens
  const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user._id as string,
    
    email: user.email,
    role: user.role
  };
  
  const tokens = generateTokens(tokenPayload);
  
  // Store refresh token in user document
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();
  
  return { user, tokens };
};

export const loginUser = async (credentials: LoginCredentials): Promise<{ user: IUser; tokens: AuthTokens }> => {
  // Find user with password
  const user = await User.findOne({ email: credentials.email }).select('+password +refreshTokens');
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Check password
  const isPasswordValid = await user.comparePassword(credentials.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate tokens
  const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user._id as string,
    email: user.email,
    role: user.role
  };
  
  const tokens = generateTokens(tokenPayload);
  
  // Store refresh token
  user.refreshTokens.push(tokens.refreshToken);
  
  // Limit refresh tokens (keep only last 5)
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  
  await user.save();
  
  return { user, tokens };
};

export const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  
  // Find user with refresh token
  const user = await User.findById(payload.userId).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new Error('Invalid refresh token');
  }
  
  // Generate new tokens
  const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user._id as string,
    email: user.email,
    role: user.role
  };
  
  const tokens = generateTokens(tokenPayload);
  
  // Replace old refresh token with new one
  const tokenIndex = user.refreshTokens.indexOf(refreshToken);
  user.refreshTokens[tokenIndex] = tokens.refreshToken;
  
  await user.save();
  
  return tokens;
};

export const logoutUser = async (userId: string, refreshToken: string): Promise<void> => {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) {
    throw new Error('User not found');
  }
  
  // Remove refresh token
  user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  await user.save();
};

export const logoutAllDevices = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) {
    throw new Error('User not found');
  }
  
  // Clear all refresh tokens
  user.refreshTokens = [];
  await user.save();
};
