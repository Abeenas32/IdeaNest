import { ILike } from '../types/like.types';
import mongoose, { Schema } from 'mongoose';

const likeSchema = new Schema<ILike>(
  {
    ideaId: {
      type: Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true // Allow multiple null values
    },
    fingerprint: {
      type: String,
      default: null,
      sparse: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'likes'
  }
);

// Compound indexes for efficient queries
likeSchema.index({ ideaId: 1, userId: 1 }, { sparse: true }); // For authenticated users
likeSchema.index({ ideaId: 1, fingerprint: 1 }, { sparse: true }); // For anonymous users
likeSchema.index({ ipAddress: 1, createdAt: 1 }); // For rate limiting
likeSchema.index({ createdAt: 1 }); // For cleanup operations

// Prevent duplicate likes
likeSchema.index(
  { ideaId: 1, userId: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { userId: { $ne: null } }
  }
);

likeSchema.index(
  { ideaId: 1, fingerprint: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { fingerprint: { $ne: null } }
  }
);

export const Like = mongoose.model<ILike>('Like', likeSchema);