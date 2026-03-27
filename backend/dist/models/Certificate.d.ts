import mongoose, { Document } from "mongoose";
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
declare const Certificate: mongoose.Model<ICertificate, {}, {}, {}, mongoose.Document<unknown, {}, ICertificate, {}, {}> & ICertificate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Certificate;
//# sourceMappingURL=Certificate.d.ts.map