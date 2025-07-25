import { likeController } from './../controllers/like.controllers';
import { optionalAuth } from './../middleware/auth.middleware';
import { Router } from "express";
// import { likeController } from "../controllers/like.controllers";
import { authenticate } from "../middleware/auth.middleware";
import { RateLimiterMiddleware } from "../middleware/rateLimit.middleware";
//

const router = Router();


 router.post('/ideas/:ideaId/like',
    optionalAuth,
    RateLimiterMiddleware.likeAction,
    likeController.toogleLike
)

 router.get('/ideas/:ideaId/like-status',
  // Correct usage for a static member:
  RateLimiterMiddleware.readOperations,
  likeController.getLikeStatus
)

router.get('ideas/:ideaId/likes',
    RateLimiterMiddleware.public,
likeController.getLikeCount)

router.get('/users/liked-ideas',
    RateLimiterMiddleware.authenticatedOperations,
    authenticate,
    likeController.getUserLikedIdeas
)

 export  { router as LikeRoutes };