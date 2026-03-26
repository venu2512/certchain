import { Request, Response } from "express";
import Certificate from "../models/Certificate.js";
import { IUser } from "../models/User.js";
import crypto from "crypto";

interface AuthRequest extends Request {
  user?: IUser;
}

export const generateChainId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(6).toString("hex");
  return `CERT-${timestamp}-${randomPart}`.toUpperCase();
};

export const getAllCertificates = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 20, recipientEmail, courseName } = req.query;

    const filter: Record<string, unknown> = {};
    if (recipientEmail) filter.recipientEmail = recipientEmail;
    if (courseName) filter.courseName = { $regex: courseName, $options: "i" };

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Certificate.countDocuments(filter);

    res.json({
      certificates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCertificateById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chainId } = req.params;

    const certificate = await Certificate.findOne({ chainId });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    res.json({ certificate });
  } catch (error) {
    console.error("Get certificate error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const createCertificate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { recipientName, recipientEmail, courseName, issueDate, issuerAddress, blockchainTxHash, metadata } =
      req.body;

    if (!recipientName || !recipientEmail || !courseName || !issueDate || !issuerAddress) {
      res.status(400).json({
        error: "recipientName, recipientEmail, courseName, issueDate, and issuerAddress are required",
      });
      return;
    }

    const chainId = generateChainId();

    const certificate = new Certificate({
      chainId,
      recipientName,
      recipientEmail,
      courseName,
      issueDate: new Date(issueDate),
      issuer: req.user?.username || "unknown",
      issuerAddress,
      blockchainTxHash,
      metadata: metadata || {},
    });

    await certificate.save();

    res.status(201).json({
      message: "Certificate created successfully",
      certificate,
    });
  } catch (error) {
    console.error("Create certificate error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chainId } = req.params;

    const certificate = await Certificate.findOne({ chainId });
    if (!certificate) {
      res.status(404).json({
        valid: false,
        error: "Certificate not found",
      });
      return;
    }

    res.json({
      valid: true,
      certificate: {
        chainId: certificate.chainId,
        recipientName: certificate.recipientName,
        recipientEmail: certificate.recipientEmail,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        issuer: certificate.issuer,
        issuerAddress: certificate.issuerAddress,
        blockchainTxHash: certificate.blockchainTxHash,
        verified: !!certificate.blockchainTxHash,
      },
    });
  } catch (error) {
    console.error("Verify certificate error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateCertificate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chainId } = req.params;
    const { blockchainTxHash, metadata } = req.body;

    const certificate = await Certificate.findOne({ chainId });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    if (blockchainTxHash) certificate.blockchainTxHash = blockchainTxHash;
    if (metadata) certificate.metadata = { ...certificate.metadata, ...metadata };

    await certificate.save();

    res.json({
      message: "Certificate updated successfully",
      certificate,
    });
  } catch (error) {
    console.error("Update certificate error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteCertificate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chainId } = req.params;

    const certificate = await Certificate.findOneAndDelete({ chainId });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    res.json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Delete certificate error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
