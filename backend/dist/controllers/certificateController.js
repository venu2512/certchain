"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicVerify = exports.downloadCertificate = exports.getCertificateStats = exports.deleteCertificate = exports.revokeCertificate = exports.updateCertificate = exports.verifyByHash = exports.verifyCertificate = exports.createCertificate = exports.getCertificateById = exports.getAllCertificates = void 0;
const Certificate_js_1 = __importDefault(require("../models/Certificate.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const crypto_js_1 = require("../utils/crypto.js");
const blockchain_js_1 = __importDefault(require("../services/blockchain.js"));
const qrcode_js_1 = require("../services/qrcode.js");
const pdf_js_1 = require("../services/pdf.js");
const email_js_1 = __importDefault(require("../services/email.js"));
const logger_js_1 = __importDefault(require("../config/logger.js"));
exports.getAllCertificates = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, recipientEmail, courseName, status, issuer } = req.query;
    const filter = {};
    if (recipientEmail)
        filter.recipientEmail = recipientEmail;
    if (courseName)
        filter.courseName = { $regex: courseName, $options: "i" };
    if (status)
        filter.status = status;
    if (issuer)
        filter.issuer = issuer;
    const certificates = await Certificate_js_1.default.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
    const total = await Certificate_js_1.default.countDocuments(filter);
    const stats = await Certificate_js_1.default.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json({
        certificates,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
        stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    });
});
exports.getCertificateById = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { certificateId } = req.params;
    const certificate = await Certificate_js_1.default.findOne({
        $or: [{ certificateId }, { uniqueCertificateId: certificateId }],
    });
    if (!certificate) {
        throw new errorHandler_js_1.NotFoundError("Certificate");
    }
    res.json({ certificate });
});
exports.createCertificate = (0, errorHandler_js_1.asyncHandler)(async (req, res, next) => {
    const { recipientName, recipientEmail, courseName, issueDate, expiryDate, issuerDetails, blockchainNetwork, metadata, } = req.body;
    const certificateId = (0, crypto_js_1.generateUniqueCertificateId)();
    const certificateHash = (0, crypto_js_1.generateCertificateHash)(certificateId, recipientName, recipientEmail, courseName, new Date(issueDate), req.user?.username || "system", issuerDetails.organization);
    const digitalSignature = certificateHash.substring(0, 64);
    const certificate = new Certificate_js_1.default({
        certificateId,
        uniqueCertificateId: `UQ-${certificateId}`,
        recipientName,
        recipientEmail,
        courseName,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        issuer: req.user?.username || "system",
        issuerDetails,
        certificateHash,
        digitalSignature,
        blockchainNetwork: blockchainNetwork || "ethereum-sepolia",
        status: "active",
        metadata: metadata || {},
    });
    const qrCode = await (0, qrcode_js_1.generateVerificationQRCode)(certificateId);
    certificate.qrCode = qrCode;
    try {
        const blockchainResult = await blockchain_js_1.default.storeCertificateHash(certificateId, certificateHash);
        certificate.blockchainTxHash = blockchainResult;
    }
    catch (blockchainError) {
        logger_js_1.default.warn("Blockchain storage failed, continuing with database only:", blockchainError);
    }
    await certificate.save();
    const pdfBase64 = await (0, pdf_js_1.generateCertificatePDFBase64)({
        certificateId: certificate.certificateId,
        uniqueCertificateId: certificate.uniqueCertificateId,
        recipientName: certificate.recipientName,
        recipientEmail: certificate.recipientEmail,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        issuer: certificate.issuer,
        issuerDetails: certificate.issuerDetails,
        certificateHash: certificate.certificateHash,
        digitalSignature: certificate.digitalSignature,
        blockchainTxHash: certificate.blockchainTxHash,
        blockchainNetwork: certificate.blockchainNetwork,
        qrCode: certificate.qrCode,
        status: certificate.status,
    });
    try {
        await email_js_1.default.sendCertificateEmail(recipientEmail, recipientName, certificateId, courseName, pdfBase64);
    }
    catch (emailError) {
        logger_js_1.default.warn("Email sending failed:", emailError);
    }
    logger_js_1.default.info(`Certificate created: ${certificateId} for ${recipientName}`);
    res.status(201).json({
        message: "Certificate created successfully",
        certificate: {
            id: certificate._id,
            certificateId: certificate.certificateId,
            uniqueCertificateId: certificate.uniqueCertificateId,
            recipientName: certificate.recipientName,
            recipientEmail: certificate.recipientEmail,
            courseName: certificate.courseName,
            issueDate: certificate.issueDate,
            status: certificate.status,
            certificateHash: certificate.certificateHash,
            blockchainTxHash: certificate.blockchainTxHash,
            qrCode: certificate.qrCode,
        },
    });
});
exports.verifyCertificate = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { certificateId } = req.params;
    const certificate = await Certificate_js_1.default.findOne({
        $or: [{ certificateId }, { uniqueCertificateId: certificateId }],
    });
    if (!certificate) {
        res.status(404).json({
            valid: false,
            error: "Certificate not found",
        });
        return;
    }
    certificate.verificationCount += 1;
    certificate.lastVerifiedAt = new Date();
    await certificate.save();
    const blockchainVerified = !!certificate.blockchainTxHash;
    const isValid = certificate.status === "active";
    res.json({
        valid: isValid && blockchainVerified,
        certificate: {
            certificateId: certificate.certificateId,
            uniqueCertificateId: certificate.uniqueCertificateId,
            recipientName: certificate.recipientName,
            recipientEmail: certificate.recipientEmail,
            courseName: certificate.courseName,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
            issuer: certificate.issuer,
            issuerDetails: certificate.issuerDetails,
            certificateHash: certificate.certificateHash,
            status: certificate.status,
            blockchainVerified,
            blockchainTxHash: certificate.blockchainTxHash,
            verificationCount: certificate.verificationCount,
            lastVerifiedAt: certificate.lastVerifiedAt,
        },
    });
});
exports.verifyByHash = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { hash } = req.query;
    if (!hash || typeof hash !== "string") {
        res.status(400).json({ error: "Certificate hash is required" });
        return;
    }
    const certificate = await Certificate_js_1.default.findOne({ certificateHash: hash });
    if (!certificate) {
        res.status(404).json({
            valid: false,
            error: "Certificate not found",
        });
        return;
    }
    res.json({
        valid: certificate.status === "active",
        certificate: {
            certificateId: certificate.certificateId,
            recipientName: certificate.recipientName,
            courseName: certificate.courseName,
            issuer: certificate.issuer,
            issueDate: certificate.issueDate,
            status: certificate.status,
        },
    });
});
exports.updateCertificate = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { certificateId } = req.params;
    const updates = req.body;
    const certificate = await Certificate_js_1.default.findOne({ certificateId });
    if (!certificate) {
        throw new errorHandler_js_1.NotFoundError("Certificate");
    }
    if (req.userRole !== "admin" && certificate.issuer !== req.user?.username) {
        throw new errorHandler_js_1.ForbiddenError("You can only update your own certificates");
    }
    const allowedUpdates = [
        "recipientName",
        "recipientEmail",
        "courseName",
        "metadata",
        "expiryDate",
    ];
    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            certificate[key] = updates[key];
        }
    }
    if (updates.recipientName || updates.courseName || updates.issueDate) {
        certificate.certificateHash = (0, crypto_js_1.generateCertificateHash)(certificate.certificateId, certificate.recipientName, certificate.recipientEmail, certificate.courseName, certificate.issueDate, certificate.issuer, certificate.issuerDetails.organization);
    }
    await certificate.save();
    logger_js_1.default.info(`Certificate updated: ${certificateId} by ${req.user?.username}`);
    res.json({
        message: "Certificate updated successfully",
        certificate,
    });
});
exports.revokeCertificate = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { certificateId } = req.params;
    const { reason } = req.body;
    const certificate = await Certificate_js_1.default.findOne({ certificateId });
    if (!certificate) {
        throw new errorHandler_js_1.NotFoundError("Certificate");
    }
    if (req.userRole !== "admin") {
        throw new errorHandler_js_1.ForbiddenError("Only admins can revoke certificates");
    }
    certificate.status = "revoked";
    if (reason) {
        certificate.metadata = { ...certificate.metadata, revocationReason: reason };
    }
    try {
        const blockchainResult = await blockchain_js_1.default.revokeCertificate(certificateId);
        certificate.metadata = {
            ...certificate.metadata,
            blockchainRevocationTx: blockchainResult.txHash,
        };
    }
    catch (blockchainError) {
        logger_js_1.default.warn("Blockchain revocation failed:", blockchainError);
    }
    await certificate.save();
    logger_js_1.default.info(`Certificate revoked: ${certificateId} by ${req.user?.username}`);
    res.json({
        message: "Certificate revoked successfully",
        certificate: {
            certificateId: certificate.certificateId,
            status: certificate.status,
            revokedAt: certificate.updatedAt,
        },
    });
});
exports.deleteCertificate = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { certificateId } = req.params;
    if (req.userRole !== "admin") {
        throw new errorHandler_js_1.ForbiddenError("Only admins can delete certificates");
    }
    const certificate = await Certificate_js_1.default.findOneAndDelete({ certificateId });
    if (!certificate) {
        throw new errorHandler_js_1.NotFoundError("Certificate");
    }
    logger_js_1.default.info(`Certificate deleted: ${certificateId} by ${req.user?.username}`);
    res.json({ message: "Certificate deleted successfully" });
});
exports.getCertificateStats = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const total = await Certificate_js_1.default.countDocuments();
    const active = await Certificate_js_1.default.countDocuments({ status: "active" });
    const revoked = await Certificate_js_1.default.countDocuments({ status: "revoked" });
    const expired = await Certificate_js_1.default.countDocuments({ status: "expired" });
    const recentCerts = await Certificate_js_1.default.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("certificateId recipientName courseName createdAt status");
    const verificationStats = await Certificate_js_1.default.aggregate([
        {
            $group: {
                _id: null,
                totalVerifications: { $sum: "$verificationCount" },
                avgVerifications: { $avg: "$verificationCount" },
            },
        },
    ]);
    res.json({
        stats: {
            total,
            active,
            revoked,
            expired,
            totalVerifications: verificationStats[0]?.totalVerifications || 0,
            avgVerifications: Math.round(verificationStats[0]?.avgVerifications || 0),
        },
        recentCertificates: recentCerts,
    });
});
exports.downloadCertificate = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { certificateId } = req.params;
    const certificate = await Certificate_js_1.default.findOne({
        $or: [{ certificateId }, { uniqueCertificateId: certificateId }],
    });
    if (!certificate) {
        throw new errorHandler_js_1.NotFoundError("Certificate");
    }
    if (req.userRole === "user" &&
        certificate.recipientEmail !== req.user?.email &&
        certificate.recipientName !== req.user?.username) {
        throw new errorHandler_js_1.ForbiddenError("You can only download your own certificates");
    }
    const pdfBase64 = await (0, pdf_js_1.generateCertificatePDFBase64)({
        certificateId: certificate.certificateId,
        uniqueCertificateId: certificate.uniqueCertificateId,
        recipientName: certificate.recipientName,
        recipientEmail: certificate.recipientEmail,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        issuer: certificate.issuer,
        issuerDetails: certificate.issuerDetails,
        certificateHash: certificate.certificateHash,
        digitalSignature: certificate.digitalSignature,
        blockchainTxHash: certificate.blockchainTxHash,
        blockchainNetwork: certificate.blockchainNetwork,
        qrCode: certificate.qrCode,
        status: certificate.status,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${certificateId}.pdf"`);
    res.send(Buffer.from(pdfBase64, "base64"));
});
exports.publicVerify = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { cert, id, hash } = req.query;
    let certificate;
    if (cert) {
        certificate = await Certificate_js_1.default.findOne({
            $or: [{ certificateId: cert }, { uniqueCertificateId: cert }],
        });
    }
    else if (id) {
        certificate = await Certificate_js_1.default.findOne({
            $or: [{ certificateId: id }, { uniqueCertificateId: id }],
        });
    }
    else if (hash) {
        certificate = await Certificate_js_1.default.findOne({ certificateHash: hash });
    }
    if (!certificate) {
        res.status(404).json({
            valid: false,
            error: "Certificate not found",
            message: "No certificate found with the provided identifier",
        });
        return;
    }
    if (certificate.status !== "active") {
        res.json({
            valid: false,
            status: certificate.status,
            certificate: {
                certificateId: certificate.certificateId,
                recipientName: certificate.recipientName,
                courseName: certificate.courseName,
                issueDate: certificate.issueDate,
                status: certificate.status,
            },
            message: `Certificate is ${certificate.status}`,
        });
        return;
    }
    res.json({
        valid: true,
        certificate: {
            certificateId: certificate.certificateId,
            uniqueCertificateId: certificate.uniqueCertificateId,
            recipientName: certificate.recipientName,
            courseName: certificate.courseName,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
            issuer: certificate.issuer,
            issuerDetails: certificate.issuerDetails,
            certificateHash: certificate.certificateHash,
            status: certificate.status,
            blockchainVerified: !!certificate.blockchainTxHash,
        },
    });
});
//# sourceMappingURL=certificateController.js.map