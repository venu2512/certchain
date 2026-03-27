"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const certificateSchema = new mongoose_1.Schema({
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
    expiryDate: {
        type: Date,
    },
    issuer: {
        type: String,
        required: true,
        trim: true,
    },
    issuerDetails: {
        organization: { type: String, required: true },
        address: { type: String, required: true },
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
        index: true,
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
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    verificationCount: {
        type: Number,
        default: 0,
    },
    lastVerifiedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
certificateSchema.index({ recipientEmail: 1 });
certificateSchema.index({ issuer: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ certificateHash: 1 });
certificateSchema.pre("save", function (next) {
    if (!this.certificateId) {
        this.certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${crypto_1.default.randomBytes(4).toString("hex").toUpperCase()}`;
    }
    if (!this.uniqueCertificateId) {
        this.uniqueCertificateId = `CERT-${crypto_1.default.randomBytes(8).toString("hex").toUpperCase()}`;
    }
    next();
});
certificateSchema.methods.generateCertificateHash = function () {
    const data = `${this.certificateId}|${this.recipientName}|${this.recipientEmail}|${this.courseName}|${this.issueDate.toISOString()}|${this.issuer}|${this.issuerDetails.organization}`;
    return crypto_1.default.createHash("sha256").update(data).digest("hex");
};
certificateSchema.methods.verifyCertificate = function (inputHash) {
    return this.certificateHash === inputHash;
};
const Certificate = mongoose_1.default.model("Certificate", certificateSchema);
exports.default = Certificate;
//# sourceMappingURL=Certificate.js.map