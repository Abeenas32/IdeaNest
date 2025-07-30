import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from 'express-mongo-sanitize';
import { config } from "../config/environment.config";

// for helmet protection used to secure HTTP headers
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

//  rate limite used to limit the number of requests from a single IP address
export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMS,
  max: config.rateLimit.max,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    timestamp: new Date().toISOString()
  },
  skip: (req: any) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// mongodb sanitizer used to prevent NoSQL injection attacks
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_'
});
