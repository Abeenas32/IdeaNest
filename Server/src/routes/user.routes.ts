import { userController } from "@/controllers/user.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { rateLimitMiddleware } from "@/middleware/security.middleware";
import { validate } from "@/middleware/validation.middleware";
import { Router } from "express";
import { createUserSchema, loginUserSchema, updateUserSchema } from "@/validators/user.validation";
import { RateLimiterMiddleware } from "@/middleware/rateLimit.middleware";

const router = Router();
router.get('/profile', RateLimiterMiddleware.authenticatedOperations, authenticate, userController.getProfile);
router.put('/profile', RateLimiterMiddleware.authenticatedOperations, authenticate, validate(updateUserSchema), userController.updateProfile)

export default router;
