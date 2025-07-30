import { z } from 'zod';

export const createIdeaSchema = z.object({
 body: z.object({
   title: z.string()
     .min(3, 'Title must be at least 3 characters')
     .max(200, 'Title must not exceed 200 characters')
     .trim(),
   content: z.string()
     .min(10, 'Content must be at least 10 characters')
     .max(5000, 'Content must not exceed 5000 characters')
     .trim(),
   tags: z.array(
     z.string()
       .trim()
       .toLowerCase()
       .max(50, 'Each tag must not exceed 50 characters')
   ).max(10, 'Maximum 10 tags allowed').optional().default([]),
   authorType: z.enum(['authenticated', 'anonymous']).optional().default('anonymous'),
   anonymousFingerprint: z.string().optional(),
   isPublic: z.boolean().optional().default(true)
 })
});

export const updateIdeaSchema = z.object({
 params: z.object({
   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid idea ID format')
 }),
 body: z.object({
   title: z.string()
     .min(3, 'Title must be at least 3 characters')
     .max(200, 'Title must not exceed 200 characters')
     .trim()
     .optional(),
   content: z.string()
     .min(10, 'Content must be at least 10 characters')
     .max(5000, 'Content must not exceed 5000 characters')
     .trim()
     .optional(),
   tags: z.array(
     z.string()
       .trim()
       .toLowerCase()
       .max(50, 'Each tag must not exceed 50 characters')
   ).max(10, 'Maximum 10 tags allowed').optional(),
   isPublic: z.boolean().optional()
 }).refine(data => Object.keys(data).length > 0, {
   message: 'At least one field must be provided to update'
 })
});

export const getIdeasSchema = z.object({
 query: z.object({
   page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).optional().default('1'),
   limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50).optional().default('10'),
   search: z.string().max(200).trim().optional(),
   tags: z.string().transform(str => str.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)).optional(),
   sortBy: z.enum(['createdAt', 'likeCount', 'viewCount', 'updatedAt']).optional().default('createdAt'),
   sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
   authorType: z.enum(['authenticated', 'anonymous']).optional(),
   isPublic: z.string().transform(str => str === 'true').optional()
 })
});

export const getIdeaByIdSchema = z.object({
 params: z.object({
   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid idea ID format')
 })
});

export const likeIdeaSchema = z.object({
 params: z.object({
   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid idea ID format')
 })
});

export const deleteIdeaSchema = z.object({
 params: z.object({
   id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid idea ID format')
 })
});