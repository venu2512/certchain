"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.ConflictError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
const mongoose_1 = require("mongoose");
const logger_js_1 = __importDefault(require("../config/logger.js"));
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized access") {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Access forbidden") {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        logger_js_1.default.warn(`Operational Error: ${err.message} - ${req.method} ${req.path}`);
        res.status(err.statusCode).json({
            error: err.message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
        return;
    }
    if (err instanceof mongoose_1.MongooseError) {
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => ({
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
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            res.status(409).json({
                error: `Duplicate entry for ${field}`,
            });
            return;
        }
    }
    logger_js_1.default.error(`Server Error: ${err.message} - ${req.method} ${req.path}`, {
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
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map