import mongoose, { Document, Schema } from "mongoose";

export interface ICertificate extends Document {
  chainId: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  issueDate: Date;
  issuer: string;
  issuerAddress: string;
  blockchainTxHash?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    chainId: {
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
      required: true,
      trim: true,
      lowercase: true,
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
    issuer: {
      type: String,
      required: true,
      trim: true,
    },
    issuerAddress: {
      type: String,
      required: true,
      trim: true,
    },
    blockchainTxHash: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ recipientEmail: 1 });
certificateSchema.index({ issuerAddress: 1 });
certificateSchema.index({ issueDate: -1 });

const Certificate = mongoose.model<ICertificate>("Certificate", certificateSchema);

export default Certificate;
