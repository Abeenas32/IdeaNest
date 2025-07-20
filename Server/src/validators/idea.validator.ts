import { regex, z } from 'zod'

export const createIdeaSchema = z.object({
    body: z.object({
        title: z.string()
            .min(3, 'Title must be at least 3 characters')
            .max(200, 'Title must not excced 200 characters')
            .trim(),
        content: z.string()
            .min(10, ' Content must be more than at least 10 charcters')
            .max(5000, 'Too much long contetnt')
            .trim(),
        tags: z.array(
            z.string()
                .trim()
                .toLowerCase()
                .max(50, 'Each tag must not exceed 50 characters0')
        ).max(10, 'Max 10 tags allowed').optional().default([])
    })
})

export const updateIdeaSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid idea ID format')
    }),
    body: z.object({
        title: z.string()
            .min(3, 'title must be at least 3 characters long')
            .max(200, 'Ttiel must not exceed 200 character')
            .trim()
            .optional(),
        content: z.string()
            .min(10, ' COntent must be at least 10 character')
            .max(5000, 'Content must not exceed 5000 characters')
            .trim()
            .optional(),
        tags: z.array(
            z.string()
                .trim()
                .toLowerCase()
                .max(50, 'Each tag must not exceed 50 characters')
        ).max(10, 'Maximum 10 tags allowed').optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provied to update '
    })
})

export const getIdeasSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50).optional().default(10),
    search: z.string().max(200).trim().optional(),
    tags: z.string().transform(str => str.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)).optional(),
    sortBy: z.enum(['createdAt', 'likeCount', 'viewCount', 'updatedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    authorType: z.enum(['authenticated', 'anonymous']).optional()
  })
});


export const getIdeaByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid idea ID format')
  })
});

