"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateParams = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schemas) => {
    return async (req, res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validate = validate;
const validateBody = (schema) => (0, exports.validate)({ body: schema });
exports.validateBody = validateBody;
const validateParams = (schema) => (0, exports.validate)({ params: schema });
exports.validateParams = validateParams;
const validateQuery = (schema) => (0, exports.validate)({ query: schema });
exports.validateQuery = validateQuery;
//# sourceMappingURL=validation.js.map