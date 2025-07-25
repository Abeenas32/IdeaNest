// src/middleware/rateLimiter.middleware.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { sendError } from '../utils/response.utils';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Custom key generator that differentiates between authenticated and anonymous users
const createKeyGenerator = (prefix: string) => {
  return (req: AuthenticatedRequest): string => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (userId) {
      return `${prefix}:user:${userId}`;
    } else {
      return `${prefix}:ip:${ip}`;
    }
  };
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  return sendError(
    res,
    'Too many requests. Please try again later.',
    429,
    JSON.stringify({
      retryAfter: Math.ceil(req.rateLimit?.resetTime ?
        (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
      limit: req.rateLimit?.limit,
      remaining: req.rateLimit?.remaining
    })
  );
};

// Enhanced rate limiter with different limits for authenticated vs anonymous users
const createDynamicRateLimit = (config: {
  windowMs: number;
  authenticatedMax: number;
  anonymousMax: number;
  prefix: string;
  message?: string;
}) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: (req: AuthenticatedRequest) => {
      // Higher limit for authenticated users
      return req.user ? config.authenticatedMax : config.anonymousMax;
    },
    keyGenerator: createKeyGenerator(config.prefix),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks or admin routes if needed
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

export class RateLimiterMiddleware {
  // Like/Unlike actions - more restrictive
  static likeAction = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 60, // 60 likes per hour for authenticated users
    anonymousMax: 30, // 30 likes per hour for anonymous users
    prefix: 'like_action',
    message: 'Too many like actions. Please slow down.'
  });

  // Idea creation - moderate restriction
  static createIdea = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 20, // 20 ideas per hour for authenticated users
    anonymousMax: 10, // 10 ideas per hour for anonymous users
    prefix: 'create_idea',
    message: 'Too many ideas created. Please wait before posting more.'
  });

  // Authentication actions - strict limits
  static authActions = createDynamicRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    authenticatedMax: 10, // 10 auth actions per 15 min for authenticated users
    anonymousMax: 5, // 5 auth actions per 15 min for anonymous users
    prefix: 'auth_action',
    message: 'Too many authentication attempts. Please wait before trying again.'
  });

  // Read operations - lenient limits
  static readOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 300, // 300 reads per hour for authenticated users
    anonymousMax: 200, // 200 reads per hour for anonymous users
    prefix: 'read_ops',
    message: 'Too many read requests. Please slow down.'
  });

  // Public endpoints - most lenient
  static public = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 500, // 500 requests per hour for authenticated users
    anonymousMax: 300, // 300 requests per hour for anonymous users
    prefix: 'public',
    message: 'Too many requests. Please try again later.'
  });

  // Authenticated operations - moderate limits
  static authenticatedOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 100, // 100 requests per hour for authenticated users
    anonymousMax: 0, // No access for anonymous users
    prefix: 'auth_ops',
    message: 'Too many requests. Please slow down.'
  });

  // Comment/Reply actions - moderate restriction
  static commentAction = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 50, // 50 comments per hour for authenticated users
    anonymousMax: 20, // 20 comments per hour for anonymous users
    prefix: 'comment_action',
    message: 'Too many comments. Please wait before posting more.'
  });

  // Search operations - lenient limits
  static searchOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 200, // 200 searches per hour for authenticated users
    anonymousMax: 100, // 100 searches per hour for anonymous users
    prefix: 'search_ops',
    message: 'Too many search requests. Please slow down.'
  });

  // Update operations - more restrictive
  static updateOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 30, // 30 updates per hour for authenticated users
    anonymousMax: 15, // 15 updates per hour for anonymous users
    prefix: 'update_ops',
    message: 'Too many update requests. Please wait before making more changes.'
  });

  // Delete operations - most restrictive
  static deleteOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    authenticatedMax: 10, // 10 deletes per hour for authenticated users
    anonymousMax: 5, // 5 deletes per hour for anonymous users
    prefix: 'delete_ops',
    message: 'Too many delete requests. Please wait before deleting more items.'
  });
}

export const rateLimiterMiddleware = new RateLimiterMiddleware();