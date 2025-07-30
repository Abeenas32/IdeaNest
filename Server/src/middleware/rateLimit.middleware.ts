// src/middleware/rateLimiter.middleware.ts
import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.utils';

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: any, res: any) => {
  return sendError(
    res,
    'Too many requests. Please try again later.',
    429
  );
};

// Enhanced rate limiter with different limits for authenticated vs anonymous users
const createDynamicRateLimit = (config: {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
}) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    keyGenerator: (req: any) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `${config.prefix}:${ip}`;
    },
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) => {
      // Skip rate limiting for health checks or admin routes if needed
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

export class RateLimiterMiddleware {
  // Like/Unlike actions - more restrictive
  static likeAction = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 60, // 60 likes per hour
    prefix: 'like_action',
    message: 'Too many like actions. Please slow down.'
  });

  // Idea creation - moderate restriction
  static createIdea = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 ideas per hour
    prefix: 'create_idea',
    message: 'Too many ideas created. Please wait before posting more.'
  });

  // Authentication actions - strict limits
  static authActions = createDynamicRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth actions per 15 min
    prefix: 'auth_action',
    message: 'Too many authentication attempts. Please wait before trying again.'
  });

  // Read operations - lenient limits
  static readOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 300, // 300 reads per hour
    prefix: 'read_ops',
    message: 'Too many read requests. Please slow down.'
  });

  // Public endpoints - most lenient
  static public = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // 500 requests per hour
    prefix: 'public',
    message: 'Too many requests. Please try again later.'
  });

  // Authenticated operations - moderate limits
  static authenticatedOperations = createDynamicRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 requests per hour
    prefix: 'auth_ops',
    message: 'Too many requests. Please slow down.'
  });

  // Comment/Reply actions - moderate restriction
  static commentAction = createDynamicRateLimit({
    // 1 hour
    windowMs: 60 * 60 * 1000,
    // 50 comments per hour
    max: 50,
    prefix: 'comment_action',
    message: 'Too many comments. Please wait before posting more.'
  });

  // Search operations - lenient limits
  static searchOperations = createDynamicRateLimit({
    // 1 hour
    windowMs: 60 * 60 * 1000,
    // 200 searches per hour
    max: 200, 
    prefix: 'search_ops',
    message: 'Too many search requests. Please slow down.'
  });

  // Update operations - more restrictive
  static updateOperations = createDynamicRateLimit({
    // 1 hour
    max: 30,
     // 30 updates per hour
    windowMs: 60 * 60 * 1000,
    prefix: 'update_ops',
    message: 'Too many update requests. Please wait before making more changes.'
  });

  // Delete operations - most restrictive
  static deleteOperations = createDynamicRateLimit({
    // 1 hour
    windowMs: 60 * 60 * 1000, 
    // 10 deletes per hour
    max: 10, 
    prefix: 'delete_ops',
    message: 'Too many delete requests. Please wait before deleting more items.'
  });
}

export const rateLimiterMiddleware = new RateLimiterMiddleware();