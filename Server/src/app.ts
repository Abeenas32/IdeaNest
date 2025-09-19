import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { securityMiddleware, rateLimitMiddleware, mongoSanitizeMiddleware } from './middleware/security.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { config } from './config/environment.config';
import { apiRoutes } from './routes/index.routes';

const app = express();

// Security middleware
app.use(securityMiddleware);
app.use(rateLimitMiddleware);
app.use(mongoSanitizeMiddleware);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🔍 Incoming Origin:", origin);

      if (!origin) return callback(null, true); // allow Postman / curl

      if (config.cors.origin.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.credentials,
    optionsSuccessStatus: config.cors.optionsSuccessStatus,
  })
);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// API routes
app.use('/', apiRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;