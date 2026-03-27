import QRCode from "qrcode";
import logger from "../config/logger.js";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

const defaultOptions: QRCodeOptions = {
  width: 300,
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
  errorCorrectionLevel: "H",
};

export const generateQRCode = async (
  data: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    const mergedOptions = { ...defaultOptions, ...options };
    
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    });
    
    logger.debug(`Generated QR code for: ${data.substring(0, 50)}...`);
    
    return qrCodeDataURL;
  } catch (error) {
    logger.error("Failed to generate QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

export const generateVerificationQRCode = async (
  certificateId: string,
  verificationUrl?: string
): Promise<string> => {
  const baseUrl = verificationUrl || process.env.VERIFICATION_URL || "https://certchain.vercel.app/verify";
  const url = `${baseUrl}?cert=${certificateId}`;
  return generateQRCode(url);
};

export const generateCertificateQRCode = async (
  certificateId: string,
  recipientName: string,
  courseName: string
): Promise<string> => {
  const data = JSON.stringify({
    id: certificateId,
    name: recipientName,
    course: courseName,
    timestamp: Date.now(),
  });
  
  return generateQRCode(data);
};

export const validateQRCode = async (qrData: string): Promise<{
  valid: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const parsed = JSON.parse(qrData);
    
    if (!parsed.id || !parsed.name) {
      return { valid: false, error: "Invalid QR code data" };
    }
    
    return { valid: true, data: parsed };
  } catch {
    if (qrData.includes("cert=") || qrData.startsWith("http")) {
      return { valid: true, data: { url: qrData } };
    }
    return { valid: false, error: "Invalid QR code format" };
  }
};

export default {
  generateQRCode,
  generateVerificationQRCode,
  generateCertificateQRCode,
  validateQRCode,
};