"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQRCode = exports.generateCertificateQRCode = exports.generateVerificationQRCode = exports.generateQRCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const logger_js_1 = __importDefault(require("../config/logger.js"));
const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
        dark: "#000000",
        light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
};
const generateQRCode = async (data, options = {}) => {
    try {
        const mergedOptions = { ...defaultOptions, ...options };
        const qrCodeDataURL = await qrcode_1.default.toDataURL(data, {
            width: mergedOptions.width,
            margin: mergedOptions.margin,
            color: mergedOptions.color,
            errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        });
        logger_js_1.default.debug(`Generated QR code for: ${data.substring(0, 50)}...`);
        return qrCodeDataURL;
    }
    catch (error) {
        logger_js_1.default.error("Failed to generate QR code:", error);
        throw new Error("Failed to generate QR code");
    }
};
exports.generateQRCode = generateQRCode;
const generateVerificationQRCode = async (certificateId, verificationUrl) => {
    const baseUrl = verificationUrl || process.env.VERIFICATION_URL || "https://certchain.vercel.app/verify";
    const url = `${baseUrl}?cert=${certificateId}`;
    return (0, exports.generateQRCode)(url);
};
exports.generateVerificationQRCode = generateVerificationQRCode;
const generateCertificateQRCode = async (certificateId, recipientName, courseName) => {
    const data = JSON.stringify({
        id: certificateId,
        name: recipientName,
        course: courseName,
        timestamp: Date.now(),
    });
    return (0, exports.generateQRCode)(data);
};
exports.generateCertificateQRCode = generateCertificateQRCode;
const validateQRCode = async (qrData) => {
    try {
        const parsed = JSON.parse(qrData);
        if (!parsed.id || !parsed.name) {
            return { valid: false, error: "Invalid QR code data" };
        }
        return { valid: true, data: parsed };
    }
    catch {
        if (qrData.includes("cert=") || qrData.startsWith("http")) {
            return { valid: true, data: { url: qrData } };
        }
        return { valid: false, error: "Invalid QR code format" };
    }
};
exports.validateQRCode = validateQRCode;
exports.default = {
    generateQRCode: exports.generateQRCode,
    generateVerificationQRCode: exports.generateVerificationQRCode,
    generateCertificateQRCode: exports.generateCertificateQRCode,
    validateQRCode: exports.validateQRCode,
};
//# sourceMappingURL=qrcode.js.map