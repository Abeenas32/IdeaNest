
import mongoose from "mongoose";

export interface LikeServiceData {
  ideaId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
}

export interface LikeResult {
  success: boolean;
  liked: boolean;
  likeCount: number;
  message?: string;
}


export interface ILike extends Document {
  ideaId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional for authenticated users
  fingerprint?: string; // For anonymous users (IP + User-Agent hash)
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}
