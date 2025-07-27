import bcrypt from 'bcrypt';

export class PasswordError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PasswordError';
  }
}

export class PasswordUtils {
  // Configuration constants
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly MAX_PASSWORD_LENGTH = 128;

  // Public config getter
  static get CONFIG() {
    return {
      SALT_ROUNDS: this.SALT_ROUNDS,
      MIN_LENGTH: this.MIN_PASSWORD_LENGTH,
      MAX_LENGTH: this.MAX_PASSWORD_LENGTH
    } as const;
  }

  /**
   * Hash a password using bcrypt with comprehensive error handling
   * @param password - Plain text password to hash
   * @returns Promise resolving to hashed password string
   * @throws PasswordError with specific error codes and messages
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      // Input validation
      if (!password) {
        throw new PasswordError('Password is required', 'MISSING_PASSWORD');
      }

      if (typeof password !== 'string') {
        throw new PasswordError('Password must be a string', 'INVALID_TYPE');
      }

      if (password.length < this.MIN_PASSWORD_LENGTH) {
        throw new PasswordError(
          `Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`, 
          'PASSWORD_TOO_SHORT'
        );
      }

      if (password.length > this.MAX_PASSWORD_LENGTH) {
        throw new PasswordError(
          `Password must not exceed ${this.MAX_PASSWORD_LENGTH} characters`, 
          'PASSWORD_TOO_LONG'
        );
      }

      // Basic strength validation
      if (!/[a-z]/.test(password)) {
        throw new PasswordError('Password must contain at least one lowercase letter', 'MISSING_LOWERCASE');
      }

      if (!/[A-Z]/.test(password)) {
        throw new PasswordError('Password must contain at least one uppercase letter', 'MISSING_UPPERCASE');
      }

      if (!/\d/.test(password)) {
        throw new PasswordError('Password must contain at least one number', 'MISSING_NUMBER');
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
        throw new PasswordError('Password must contain at least one special character', 'MISSING_SPECIAL_CHAR');
      }

      // Hash the password
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      if (!hashedPassword) {
        throw new PasswordError('Failed to generate password hash', 'HASH_GENERATION_FAILED');
      }

      return hashedPassword;

    } catch (error) {
      // Re-throw PasswordError as-is
      if (error instanceof PasswordError) {
        console.error(`[PasswordError] ${error.code}: ${error.message}`);
        throw error;
      }

      // Handle bcrypt errors
      if (error instanceof Error) {
        console.error('Bcrypt error during password hashing:', error);
        throw new PasswordError(`Password hashing failed: ${error.message}`, 'BCRYPT_ERROR');
      }

      // Handle unknown errors
      console.error('Unknown error during password hashing:', error);
      throw new PasswordError('Password hashing failed due to unknown error', 'UNKNOWN_ERROR');
    }
  }

  /**
   * Verify a password against its hash with comprehensive error handling
   * @param password - Plain text password to verify
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise resolving to boolean indicating if password matches
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      // Input validation with detailed logging
      if (!password || !hashedPassword) {
        console.warn('[Password Verification] Missing password or hash - verification failed');
        return false;
      }

      if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
        console.warn('[Password Verification] Invalid input types - expected strings');
        return false;
      }

      if (password.length === 0) {
        console.warn('[Password Verification] Empty password provided');
        return false;
      }

      if (hashedPassword.length === 0) {
        console.warn('[Password Verification] Empty hash provided');
        return false;
      }

      // Additional hash format validation
      if (!hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2y$')) {
        console.warn('[Password Verification] Invalid bcrypt hash format');
        return false;
      }

      if (hashedPassword.length < 50) {
        console.warn('[Password Verification] Hash appears to be too short for valid bcrypt hash');
        return false;
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, hashedPassword);
      
      if (isMatch) {
        console.log('[Password Verification] Password verified successfully');
      } else {
        console.log('[Password Verification] Password verification failed - invalid password');
      }

      return isMatch;

    } catch (error) {
      // Log the error but don't throw - return false for failed verification
      if (error instanceof Error) {
        console.error('[Password Verification] Bcrypt comparison error:', error.message);
        
        // Handle specific bcrypt errors
        if (error.message.includes('Invalid salt') || error.message.includes('Invalid hash')) {
          console.error('[Password Verification] Invalid hash format detected');
        }
        
        if (error.message.includes('data and hash arguments required')) {
          console.error('[Password Verification] Missing required arguments');
        }
      } else {
        console.error('[Password Verification] Unknown error during verification:', error);
      }

      // For verification, we return false instead of throwing
      // This prevents authentication bypass due to errors
      return false;
    }
  }
}


export const { hashPassword, verifyPassword } = PasswordUtils;