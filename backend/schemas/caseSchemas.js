import {z} from 'zod';

export const caseSchema = z.object({
    id: zn.number().int().positive().optional(),
    title: z.string().min(3),
    description: z.string().min(1),
    solution: z.string().nullable().min(1),
    assignee: z.array(z.string()).min(1).optional(),
    status: z.enum(['open', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    draft: z.boolean().optional(),
    craftedAt: z.date().optional(),
    updatedAt: z.date().optional(),
    attachmentSchema: z.array(attachmentSchema).optional(),
    });

export const attachmentSchema = z.object({
    id: z.number().int().positive().optional(),
    filename: z.string().min(3),
    filepath: z.string().min(3),
    mimetype: z.string().min(3),
    size: z.number().int().positive(),
    description: z.string().min(3),‚
    uploadedAt: z.date().optional(),
    filehash: z.string().min(3),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    });