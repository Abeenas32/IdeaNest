import { z } from 'zod';

export const createUserSchema = z.object({
 body: z.object({
   email: z.string()
     .email('Please provide a valid email address')
     .toLowerCase()
     .trim(),
   password: z.string()
     .min(8, 'Password must be at least 8 characters long')
     .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
       'Password must contain uppercase, lowercase, number and special character'),
   name: z.string()
     .min(2, 'Name must be at least 2 characters')
     .max(50, 'Name cannot exceed 50 characters')
     .trim()
     .optional(),
   bio: z.string()
     .max(500, 'Bio cannot exceed 500 characters')
     .trim()
     .optional(),
   avatar: z.string()
     .url('Avatar must be a valid URL')
     .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Avatar must be a valid image URL')
     .optional()
 })
});

export const loginUserSchema = z.object({
 body: z.object({
   email: z.string()
     .email('Please provide a valid email address')
     .toLowerCase()
     .trim(),
   password: z.string()
     .min(1, 'Password is required')
 })
});

export const updateUserSchema = z.object({
 params: z.object({
   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
 }),
 body: z.object({
   name: z.string()
     .min(2, 'Name must be at least 2 characters')
     .max(50, 'Name cannot exceed 50 characters')
     .trim()
     .optional(),
   bio: z.string()
     .max(500, 'Bio cannot exceed 500 characters')
     .trim()
     .optional(),
   avatar: z.string()
     .url('Avatar must be a valid URL')
     .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Avatar must be a valid image URL')
     .optional()
 }).refine(data => Object.keys(data).length > 0, {
   message: 'At least one field must be provided to update'
 })
});

export const changePasswordSchema = z.object({
 body: z.object({
   currentPassword: z.string()
     .min(1, 'Current password is required'),
   newPassword: z.string()
     .min(8, 'Password must be at least 8 characters long')
     .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
       'Password must contain uppercase, lowercase, number and special character')
 }).refine(data => data.currentPassword !== data.newPassword, {
   message: 'New password must be different from current password',
   path: ['newPassword']
 })
});

export const getUsersSchema = z.object({
 query: z.object({
   page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).optional().default(1),
   limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).optional().default(10),
   search: z.string().max(100).trim().optional(),
   role: z.enum(['user', 'admin']).optional(),
   isActive: z.string().transform(str => str === 'true').optional(),
   isEmailVerified: z.string().transform(str => str === 'true').optional(),
   sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email']).optional().default('createdAt'),
   sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
   includeDeleted: z.string().transform(str => str === 'true').optional().default(false)
 })
});

export const getUserByIdSchema = z.object({
 params: z.object({
   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
 })
});