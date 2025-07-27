import mongoose, { Document, Schema } from 'mongoose';

export interface IIdea extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  authorId?: mongoose.Types.ObjectId;
  authorType: 'authenticated' | 'anonymous';
  anonymousFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ideaSchema = new Schema<IIdea>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
    index: 'text'
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000,
    index: 'text'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  authorType: {
    type: String,
    enum: ['authenticated', 'anonymous'],
    required: true,
    default: 'anonymous'
  },
  anonymousFingerprint: {
    type: String,
    sparse: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function( ret: Record<string, any>) {
  delete ret.ipAddress;
  delete ret.userAgent;
  delete ret.anonymousFingerprint;
  delete ret.__v;
  return ret; 
}

  },
  toObject: { virtuals: true }
});

// Indexes for performance
ideaSchema.index({ createdAt: -1 });
ideaSchema.index({ likeCount: -1, createdAt: -1 });
ideaSchema.index({ tags: 1 });
ideaSchema.index({ authorId: 1, createdAt: -1 });
ideaSchema.index({ isPublic: 1, createdAt: -1 });
ideaSchema.index({ title: 'text', content: 'text' });

// Compound index for duplicate prevention
ideaSchema.index({ 
  title: 1, 
  authorId: 1, 
  anonymousFingerprint: 1, 
  createdAt: 1 
});

export const Idea = mongoose.model<IIdea>('Idea', ideaSchema);