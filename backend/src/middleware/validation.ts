import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

interface ValidationSchemas {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        schemas.params.parse(req.params);
      }
      if (schemas.query) {
        schemas.query.parse(req.query);
      }
      if (schemas.body) {
        const processedBody = { ...req.body };
        
        if (processedBody.issueDate) {
          processedBody.issueDate = new Date(processedBody.issueDate);
        }
        if (processedBody.expiryDate) {
          processedBody.expiryDate = new Date(processedBody.expiryDate);
        }
        
        schemas.body.parse(processedBody);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
};

export const validateBody = (schema: z.ZodSchema) => validate({ body: schema });
export const validateParams = (schema: z.ZodSchema) => validate({ params: schema });
export const validateQuery = (schema: z.ZodSchema) => validate({ query: schema });