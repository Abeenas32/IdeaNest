import { userController } from "@/controllers/user.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { rateLimitMiddleware } from "@/middleware/security.middleware";
import { validate } from "@/middleware/validation.middleware";
import { Router } from "express";
import { createUserSchema, deleteUserSchema, loginUserSchema, updateUserSchema } from "@/validators/user.validation";
import { RateLimiterMiddleware } from "@/middleware/rateLimit.middleware";

const router = Router();
router.get('/profile', RateLimiterMiddleware.authenticatedOperations, authenticate, userController.getProfile);
router.put('/profile', RateLimiterMiddleware.authenticatedOperations, authenticate, validate(updateUserSchema), userController.updateProfile)
router.delete('/account',RateLimiterMiddleware.deleteOperations, authenticate,validate(deleteUserSchema),userController.deleteAccount);
router.get('/search',RateLimiterMiddleware.searchOperations, userController.searchUsers);
router.get('/:userId', RateLimiterMiddleware.readOperations, userController.getPublicProfile);
router.get('/:userId/ideas', RateLimiterMiddleware.readOperations, userController.getUserIdeas);
router.get('/:userId/stats', RateLimiterMiddleware.readOperations, userController.getUserStats);

export {router as userRoutes };
