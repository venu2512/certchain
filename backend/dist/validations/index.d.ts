import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["admin", "organization", "user"]>>;
    organization: z.ZodOptional<z.ZodString>;
    organizationDetails: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        contact: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        address?: string | undefined;
        contact?: string | undefined;
        website?: string | undefined;
    }, {
        name?: string | undefined;
        address?: string | undefined;
        contact?: string | undefined;
        website?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
    organization?: string | undefined;
    role?: "admin" | "organization" | "user" | undefined;
    organizationDetails?: {
        name?: string | undefined;
        address?: string | undefined;
        contact?: string | undefined;
        website?: string | undefined;
    } | undefined;
}, {
    username: string;
    email: string;
    password: string;
    organization?: string | undefined;
    role?: "admin" | "organization" | "user" | undefined;
    organizationDetails?: {
        name?: string | undefined;
        address?: string | undefined;
        contact?: string | undefined;
        website?: string | undefined;
    } | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const certificateSchema: z.ZodObject<{
    recipientName: z.ZodString;
    recipientEmail: z.ZodString;
    courseName: z.ZodString;
    issueDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    expiryDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    issuerDetails: z.ZodObject<{
        organization: z.ZodString;
        address: z.ZodString;
        contact: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        organization: string;
        address: string;
        contact?: string | undefined;
        website?: string | undefined;
    }, {
        organization: string;
        address: string;
        contact?: string | undefined;
        website?: string | undefined;
    }>;
    blockchainNetwork: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    recipientName: string;
    recipientEmail: string;
    courseName: string;
    issueDate: string | Date;
    issuerDetails: {
        organization: string;
        address: string;
        contact?: string | undefined;
        website?: string | undefined;
    };
    expiryDate?: string | Date | undefined;
    blockchainNetwork?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    recipientName: string;
    recipientEmail: string;
    courseName: string;
    issueDate: string | Date;
    issuerDetails: {
        organization: string;
        address: string;
        contact?: string | undefined;
        website?: string | undefined;
    };
    expiryDate?: string | Date | undefined;
    blockchainNetwork?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const updateCertificateSchema: z.ZodObject<{
    recipientName: z.ZodOptional<z.ZodString>;
    recipientEmail: z.ZodOptional<z.ZodString>;
    courseName: z.ZodOptional<z.ZodString>;
    blockchainTxHash: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    recipientName?: string | undefined;
    recipientEmail?: string | undefined;
    courseName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    blockchainTxHash?: string | undefined;
}, {
    recipientName?: string | undefined;
    recipientEmail?: string | undefined;
    courseName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    blockchainTxHash?: string | undefined;
}>;
export declare const verifyCertificateSchema: z.ZodObject<{
    certificateId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    certificateId: string;
}, {
    certificateId: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
export type VerifyCertificateInput = z.infer<typeof verifyCertificateSchema>;
//# sourceMappingURL=index.d.ts.map