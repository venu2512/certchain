import { Request, Response, NextFunction } from "express";
import { z } from "zod";
interface ValidationSchemas {
    body?: z.ZodSchema;
    params?: z.ZodSchema;
    query?: z.ZodSchema;
}
export declare const validate: (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBody: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=validation.d.ts.map