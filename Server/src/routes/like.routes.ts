import { Router } from "express";
import { likeController } from "../controllers/like.controllers";
import { optionalAuth, authenticate } from "../middleware/auth.middleware";
import { RateLimiterMiddleware } from "../middleware/rateLimit.middleware";

const router = Router();

// Like or Unlike an idea
router.post(
  '/ideas/:ideaId/like',
  optionalAuth,
  RateLimiterMiddleware.likeAction,
  likeController.toogleLike // ⚠️ consider correcting to: toggleLike
);

// Check if the current user has liked the idea
router.get(
  '/ideas/:ideaId/like-status',
  RateLimiterMiddleware.readOperations,
  likeController.getLikeStatus
);

// Get total like count for an idea
router.get(
  '/ideas/:ideaId/likes', // ✅ added missing slash
  RateLimiterMiddleware.public,
  likeController.getLikeCount
);

// Get all ideas liked by the authenticated user
router.get(
  '/users/liked-ideas',
  RateLimiterMiddleware.authenticatedOperations,
  authenticate,
  likeController.getUserLikedIdeas
);

export { router as LikeRoutes };
