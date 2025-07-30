import mongoose, { Schema, Document, Query } from 'mongoose';
import { hashPassword, verifyPassword } from '../utils/password.utils';

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  isEmailVerified: boolean;
  isActive: boolean;
  refreshTokens: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAdmin(): boolean;
  isModerator(): boolean;
  canModerate(): boolean;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
    // Don't include password in queries by default
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Avatar must be a valid image URL'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshTokens: [{
    type: String,
    select: false
  }],
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ name: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const hashedPassword = await hashPassword(this.password);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method using your password utils
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await verifyPassword(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

// Admin role check methods
userSchema.methods.isAdmin = function(): boolean {
  return this.role === 'admin' && this.isActive && !this.deletedAt;
};

userSchema.methods.isModerator = function(): boolean {
  return this.role === 'moderator' && this.isActive && !this.deletedAt;
};

userSchema.methods.canModerate = function(): boolean {
  return (this.role === 'admin' || this.role === 'moderator') && 
         this.isActive && 
         !this.deletedAt;
};

// Soft delete middleware - only return active users by default
userSchema.pre(/^find/, function(this: Query<any, any>, next) {
  // Check if the query has a custom option to include deleted users
  const options = (this as any).getOptions?.() || {};
  
  // Only apply filter if not explicitly including deleted users
  if (!options.includeDeleted) {
    this.find({ deletedAt: { $eq: null } });
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);

userSchema.statics.findWithDeleted = async function(filter = {}, options = {}) {
  try {
    return await this.find(filter, null, options).setOptions({ includeDeleted: true });
  } catch (error) {
    console.error('Error in findWithDeleted:', error);
    throw new Error(`Failed to find users with deleted: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

userSchema.statics.findOnlyDeleted = async function(filter = {}, options = {}) {
  try {
    const deletedFilter = { 
      ...filter, 
      deletedAt: { $ne: null } 
    };
    return await this.find(deletedFilter, null, options).setOptions({ includeDeleted: true });
  } catch (error) {
    console.error('Error in findOnlyDeleted:', error);
    throw new Error(`Failed to find deleted users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Admin-specific static methods
userSchema.statics.findAdmins = async function(filter = {}, options = {}) {
  try {
    const adminFilter = { 
      ...filter,
      role: 'admin', 
      isActive: true,
      deletedAt: null 
    };
    return await this.find(adminFilter, null, options);
  } catch (error) {
    console.error('Error in findAdmins:', error);
    throw new Error(`Failed to find admin users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
userSchema.statics.findModerators = async function(filter = {}, options = {}) {
  try {
    const moderatorFilter = { 
      ...filter,
      role: { $in: ['admin', 'moderator'] }, 
      isActive: true,
      deletedAt: null 
    };
    return await this.find(moderatorFilter, null, options);
  } catch (error) {
    console.error('Error in findModerators:', error);
    throw new Error(`Failed to find moderator users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};