const { z } = require('zod');

const createPostSchema = z.object({
    title: z
        .string()
        .min(1, { message: 'Title cannot be empty' })
        .max(255, { message: 'Title cannot exceed 255 characters' })
        .trim(),
    content: z
        .string()
        .min(1, { message: 'Content cannot be empty' })
        .trim(),
    mediaUrl: z
        .string()
        .url({ message: 'Media URL must be valid' })
        .max(2048, { message: 'Media URL too long' })
        .optional()
        .nullable(),
    isPrivate: z.boolean().optional()

});

const updatePostSchema = z.object({
    title: z
        .string()
        .min(1, { message: 'Title cannot be empty' })
        .max(255, { message: 'Title cannot exceed 255 characters' })
        .trim()
        .optional(),
    content: z
        .string()
        .min(1, { message: 'Content cannot be empty' })
        .trim()
        .optional(),
    isPrivate: z.boolean().optional()
});


module.exports = {
    createPostSchema,
    updatePostSchema,

};
