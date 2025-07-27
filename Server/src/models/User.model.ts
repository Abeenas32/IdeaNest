import mongoose, { Schema, Document, Query } from 'mongoose';
import { hashPassword, verifyPassword } from '../utils/password.utils';

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  refreshTokens: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    select: false
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
    enum: ['user', 'admin'],
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

userSchema.statics.findWithDeleted = function() {
  return this.find().setOptions({ includeDeleted: true });
};

userSchema.statics.findOnlyDeleted = function() {
  return this.find({ deletedAt: { $ne: null } });
};