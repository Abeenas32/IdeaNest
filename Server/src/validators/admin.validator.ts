import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
  }),
  body: z.object({
    role: z.enum(['user', 'admin', 'moderator'], {
      errorMap: () => ({ message: 'Role must be user, admin, or moderator' })
    })
  })
});

export const bulkUpdateUserRolesSchema = z.object({
  body: z.object({
    updates: z.array(z.object({
      userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
      role: z.enum(['user', 'admin', 'moderator'], {
        errorMap: () => ({ message: 'Role must be user, admin, or moderator' })
      })
    })).min(1, 'At least one update is required').max(50, 'Maximum 50 updates allowed')
  })
});

export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
  })
});

export const getAllUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).optional().default('20'),
    role: z.enum(['user', 'admin', 'moderator']).optional(),
    isActive: z.string().transform(str => str === 'true').optional(),
    isEmailVerified: z.string().transform(str => str === 'true').optional(),
    search: z.string().max(100).trim().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email', 'role']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});

export const getAnalyticsSchema = z.object({
  query: z.object({
    days: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 365).optional().default('30')
  })
});

export const getModerationQueueSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50).optional().default('20')
  })
}); 