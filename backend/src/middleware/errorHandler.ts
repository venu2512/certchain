import { Request, Response, NextFunction } from "express";
import { MongooseError } from "mongoose";
import logger from "../config/logger.js";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message} - ${req.method} ${req.path}`);
    res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof MongooseError) {
    if (err.name === "ValidationError") {
      const errors = Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
      res.status(400).json({
        error: "Validation error",
        details: errors,
      });
      return;
    }
    if (err.name === "CastError") {
      res.status(400).json({
        error: "Invalid ID format",
      });
      return;
    }
    if ((err as any).code === 11000) {
      const field = Object.keys((err as any).keyValue)[0];
      res.status(409).json({
        error: `Duplicate entry for ${field}`,
      });
      return;
    }
  }

  logger.error(`Server Error: ${err.message} - ${req.method} ${req.path}`, {
    stack: err.stack,
    body: req.body,
  });

  res.status(500).json({
    error: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};