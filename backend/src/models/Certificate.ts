import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";

export interface ICertificate extends Document {
  certificateId: string;
  uniqueCertificateId: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  issueDate: Date;
  expiryDate?: Date;
  issuer: string;
  issuerDetails: {
    organization: string;
    address: string;
    contact: string;
    website: string;
  };
  blockchainTxHash?: string;
  blockchainNetwork: string;
  certificateHash: string;
  digitalSignature: string;
  qrCode?: string;
  ipfsCid?: string;
  status: "active" | "revoked" | "expired";
  metadata?: Record<string, unknown>;
  verificationCount: number;
  lastVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    uniqueCertificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: "",
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    issuer: {
      type: String,
      required: true,
      trim: true,
    },
    issuerDetails: {
      organization: { type: String, default: "Unknown" },
      address: { type: String, default: "" },
      contact: { type: String },
      website: { type: String },
    },
    blockchainTxHash: {
      type: String,
      trim: true,
    },
    blockchainNetwork: {
      type: String,
      default: "ethereum-sepolia",
    },
    certificateHash: {
      type: String,
      required: true,
    },
    digitalSignature: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String,
    },
    ipfsCid: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    lastVerifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ recipientEmail: 1 });
certificateSchema.index({ issuer: 1 });
certificateSchema.index({ status: 1 });

certificateSchema.pre("save", function (next) {
  if (!this.certificateId) {
    this.certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }
  if (!this.uniqueCertificateId) {
    this.uniqueCertificateId = `CERT-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  }
  next();
});

certificateSchema.methods.generateCertificateHash = function (): string {
  const data = `${this.certificateId}|${this.recipientName}|${this.recipientEmail}|${this.courseName}|${this.issueDate.toISOString()}|${this.issuer}|${this.issuerDetails.organization}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};

certificateSchema.methods.verifyCertificate = function (inputHash: string): boolean {
  return this.certificateHash === inputHash;
};

const Certificate = mongoose.model<ICertificate>("Certificate", certificateSchema);

export default Certificate;