import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "organization", "user"]).optional(),
  organization: z.string().optional(),
  organizationDetails: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    contact: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
});

export const certificateSchema = z.object({
  certificateId: z.string().min(1, "Certificate ID is required").optional(),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  courseName: z.string().min(1, "Course name is required"),
  issueDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  issuerDetails: z.object({
    organization: z.string().optional(),
    address: z.string().optional(),
    contact: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  issuerAddress: z.string().optional(),
  blockchainNetwork: z.string().optional(),
  blockchainTxHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateCertificateSchema = z.object({
  recipientName: z.string().min(2).optional(),
  recipientEmail: z.string().email().optional(),
  courseName: z.string().min(2).optional(),
  blockchainTxHash: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const verifyCertificateSchema = z.object({
  certificateId: z.string().min(1, "Certificate ID is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
export type VerifyCertificateInput = z.infer<typeof verifyCertificateSchema>;