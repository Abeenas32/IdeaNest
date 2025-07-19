import { LoginCredentials, RegisterCredentials, AuthTokens, TokenPayload } from './../types/auth.types';
import { generateAccessTokens, generateTokens, verifyAccessTokens, verifyRefreshToken } from '../utils/jwt.utils';
import { IUser, User } from './../models/User.model';

export const registerUser = async (credentials: RegisterCredentials): Promise<{ user: IUser; tokens: AuthTokens }> => {
    const existingUser = await User.findOne({ email: credentials.email });
    if (existingUser) {
        throw new Error("User Already exists");
    }
    const user = new User({
        email: credentials.email,
        password: credentials.password
    })
    await user.save();

    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId: user._id as string,
        email: user.email,
        role: user.role,
    }

    const tokens = generateTokens(tokenPayload)

    return { user, tokens }
}

export const refreshTokens = async (refreshTokens: string): Promise<AuthTokens> => {
    //  refresh token verification  
    const payload = verifyRefreshToken(refreshTokens);
    //  find if user exists 
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshTokens)) {
        throw new Error(" Invalid refresh token");
    }
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
        userId: user._id as string,
        email: user.email,
        role: user.role,
    }
    const tokens = generateTokens(tokenPayload);
    const tokenIndex = user.refreshTokens.indexOf(refreshTokens);
    user.refreshTokens[tokenIndex] = tokens.refreshToken;
    await user.save();
    return tokens;
}
export const logoutAllDevices = async (userId: string): Promise<void> => {
    const user = await User.findById(userId).select('+refreshtokens');
    if (!user) {
        throw new Error("User not found");
    }
    user.refreshTokens = [];
    await user.save();
}

