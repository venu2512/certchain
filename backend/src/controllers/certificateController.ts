import { Request, Response, NextFunction } from "express";
import Certificate from "../models/Certificate.js";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler, NotFoundError, ForbiddenError } from "../middleware/errorHandler.js";
import { generateCertificateHash, generateUniqueCertificateId } from "../utils/crypto.js";
import blockchainService from "../services/blockchain.js";
import { generateVerificationQRCode } from "../services/qrcode.js";
import { generateCertificatePDFBase64 } from "../services/pdf.js";
import emailService from "../services/email.js";
import logger from "../config/logger.js";

export const getAllCertificates = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, recipientEmail, courseName, status, issuer } = req.query;

    const filter: any = {};
    if (recipientEmail) filter.recipientEmail = recipientEmail;
    if (courseName) filter.courseName = { $regex: courseName, $options: "i" };
    if (status) filter.status = status;
    if (issuer) filter.issuer = issuer;

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Certificate.countDocuments(filter);

    const stats = await Certificate.aggregate([
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
  }
);

export const getCertificateById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      $or: [{ certificateId }, { uniqueCertificateId: certificateId }],
    });

    if (!certificate) {
      throw new NotFoundError("Certificate");
    }

    res.json({ certificate });
  }
);

export const createCertificate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      certificateId: providedCertificateId,
      recipientName,
      recipientEmail,
      courseName,
      issueDate,
      expiryDate,
      issuerDetails,
      blockchainNetwork,
      metadata,
    } = req.body;

    const certificateId = providedCertificateId || generateUniqueCertificateId();
    const certificateHash = generateCertificateHash(
      certificateId,
      recipientName,
      recipientEmail,
      courseName,
      new Date(issueDate || Date.now()),
      req.user?.username || "system",
      issuerDetails?.organization || metadata?.organization || "Unknown"
    );

    const digitalSignature = certificateHash.substring(0, 64);

    const certificate = new Certificate({
      certificateId,
      uniqueCertificateId: `UQ-${certificateId}`,
      recipientName,
      recipientEmail,
      courseName,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      issuer: req.user?.username || "system",
      issuerDetails,
      certificateHash,
      digitalSignature,
      blockchainNetwork: blockchainNetwork || "ethereum-sepolia",
      status: "active",
      metadata: metadata || {},
    });

    const qrCode = await generateVerificationQRCode(certificateId);
    certificate.qrCode = qrCode;

    try {
      const blockchainResult = await blockchainService.storeCertificateHash(
        certificateId,
        certificateHash
      );
      certificate.blockchainTxHash = blockchainResult;
    } catch (blockchainError) {
      logger.warn("Blockchain storage failed, continuing with database only:", blockchainError);
    }

    await certificate.save();

    const pdfBase64 = await generateCertificatePDFBase64({
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
      await emailService.sendCertificateEmail(
        recipientEmail,
        recipientName,
        certificateId,
        courseName,
        pdfBase64
      );
    } catch (emailError) {
      logger.warn("Email sending failed:", emailError);
    }

    logger.info(`Certificate created: ${certificateId} for ${recipientName}`);

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
  }
);

export const verifyCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
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
  }
);

export const verifyByHash = asyncHandler(
  async (req: Request, res: Response) => {
    const { hash } = req.query;

    if (!hash || typeof hash !== "string") {
      res.status(400).json({ error: "Certificate hash is required" });
      return;
    }

    const certificate = await Certificate.findOne({ certificateHash: hash });

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
  }
);

export const updateCertificate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { certificateId } = req.params;
    const updates = req.body;

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      throw new NotFoundError("Certificate");
    }

    if (req.userRole !== "admin" && certificate.issuer !== req.user?.username) {
      throw new ForbiddenError("You can only update your own certificates");
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
        (certificate as any)[key] = updates[key];
      }
    }

    if (updates.recipientName || updates.courseName || updates.issueDate) {
      certificate.certificateHash = generateCertificateHash(
        certificate.certificateId,
        certificate.recipientName,
        certificate.recipientEmail,
        certificate.courseName,
        certificate.issueDate,
        certificate.issuer,
        certificate.issuerDetails.organization
      );
    }

    await certificate.save();

    logger.info(`Certificate updated: ${certificateId} by ${req.user?.username}`);

    res.json({
      message: "Certificate updated successfully",
      certificate,
    });
  }
);

export const revokeCertificate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { certificateId } = req.params;
    const { reason } = req.body;

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      throw new NotFoundError("Certificate");
    }

    if (req.userRole !== "admin") {
      throw new ForbiddenError("Only admins can revoke certificates");
    }

    certificate.status = "revoked";
    if (reason) {
      certificate.metadata = { ...certificate.metadata, revocationReason: reason };
    }

    try {
      const blockchainResult = await blockchainService.revokeCertificate(certificateId);
      certificate.metadata = {
        ...certificate.metadata,
        blockchainRevocationTx: blockchainResult.txHash,
      };
    } catch (blockchainError) {
      logger.warn("Blockchain revocation failed:", blockchainError);
    }

    await certificate.save();

    logger.info(`Certificate revoked: ${certificateId} by ${req.user?.username}`);

    res.json({
      message: "Certificate revoked successfully",
      certificate: {
        certificateId: certificate.certificateId,
        status: certificate.status,
        revokedAt: certificate.updatedAt,
      },
    });
  }
);

export const deleteCertificate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { certificateId } = req.params;

    if (req.userRole !== "admin") {
      throw new ForbiddenError("Only admins can delete certificates");
    }

    const certificate = await Certificate.findOneAndDelete({ certificateId });

    if (!certificate) {
      throw new NotFoundError("Certificate");
    }

    logger.info(`Certificate deleted: ${certificateId} by ${req.user?.username}`);

    res.json({ message: "Certificate deleted successfully" });
  }
);

export const getCertificateStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const total = await Certificate.countDocuments();
    const active = await Certificate.countDocuments({ status: "active" });
    const revoked = await Certificate.countDocuments({ status: "revoked" });
    const expired = await Certificate.countDocuments({ status: "expired" });

    const recentCerts = await Certificate.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("certificateId recipientName courseName createdAt status");

    const verificationStats = await Certificate.aggregate([
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
  }
);

export const downloadCertificate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      $or: [{ certificateId }, { uniqueCertificateId: certificateId }],
    });

    if (!certificate) {
      throw new NotFoundError("Certificate");
    }

    if (req.userRole === "user" && 
        certificate.recipientEmail !== req.user?.email && 
        certificate.recipientName !== req.user?.username) {
      throw new ForbiddenError("You can only download your own certificates");
    }

    const pdfBase64 = await generateCertificatePDFBase64({
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${certificateId}.pdf"`
    );
    res.send(Buffer.from(pdfBase64, "base64"));
  }
);

export const publicVerify = asyncHandler(
  async (req: Request, res: Response) => {
    const { cert, id, hash } = req.query;

    let certificate;

    if (cert) {
      certificate = await Certificate.findOne({
        $or: [{ certificateId: cert }, { uniqueCertificateId: cert }],
      });
    } else if (id) {
      certificate = await Certificate.findOne({
        $or: [{ certificateId: id }, { uniqueCertificateId: id }],
      });
    } else if (hash) {
      certificate = await Certificate.findOne({ certificateHash: hash });
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
  }
);