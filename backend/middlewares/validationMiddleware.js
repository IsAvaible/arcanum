import {Request, Response, NextFunction} from 'express';
import {z, zodError} from 'zod';

export const validationMiddleware = (schema: z.ZodType<any>) => {