"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCertificateSchema = exports.updateCertificateSchema = exports.certificateSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    role: zod_1.z.enum(["admin", "organization", "user"]).optional(),
    organization: zod_1.z.string().optional(),
    organizationDetails: zod_1.z.object({
        name: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        contact: zod_1.z.string().optional(),
        website: zod_1.z.string().url().optional(),
    }).optional(),
});
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.certificateSchema = zod_1.z.object({
    recipientName: zod_1.z.string().min(2, "Recipient name must be at least 2 characters"),
    recipientEmail: zod_1.z.string().email("Invalid email format"),
    courseName: zod_1.z.string().min(2, "Course name must be at least 2 characters"),
    issueDate: zod_1.z.string().or(zod_1.z.date()),
    expiryDate: zod_1.z.string().or(zod_1.z.date()).optional(),
    issuerDetails: zod_1.z.object({
        organization: zod_1.z.string().min(1, "Organization is required"),
        address: zod_1.z.string().min(1, "Organization address is required"),
        contact: zod_1.z.string().optional(),
        website: zod_1.z.string().url().optional(),
    }),
    blockchainNetwork: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.updateCertificateSchema = zod_1.z.object({
    recipientName: zod_1.z.string().min(2).optional(),
    recipientEmail: zod_1.z.string().email().optional(),
    courseName: zod_1.z.string().min(2).optional(),
    blockchainTxHash: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.verifyCertificateSchema = zod_1.z.object({
    certificateId: zod_1.z.string().min(1, "Certificate ID is required"),
});
//# sourceMappingURL=index.js.map