"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificatePDFBase64 = exports.generateCertificatePDF = void 0;
const jspdf_1 = require("jspdf");
const logger_js_1 = __importDefault(require("../config/logger.js"));
const generatePDF = async (data) => {
    const doc = new jspdf_1.jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    doc.setFillColor(250, 251, 252);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setDrawColor(0, 150, 200);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setDrawColor(0, 150, 200);
    doc.setLineWidth(0.2);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
    doc.setFillColor(0, 150, 200);
    doc.rect(0, 0, pageWidth, 4, "F");
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(0, 100, 150);
    doc.text("CERTIFICATE OF COMPLETION", centerX, 35, { align: "center" });
    doc.setDrawColor(0, 180, 220);
    doc.setLineWidth(0.5);
    doc.line(centerX - 60, 40, centerX + 60, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("This is to certify that", centerX, 55, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text(data.recipientName, centerX, 70, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("has successfully completed the course", centerX, 85, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 100, 150);
    doc.text(data.courseName, centerX, 100, { align: "center" });
    const issueDateStr = new Date(data.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Issue Date: ${issueDateStr}`, centerX, 115, { align: "center" });
    if (data.expiryDate) {
        const expiryDateStr = new Date(data.expiryDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        doc.text(`Valid Until: ${expiryDateStr}`, centerX, 122, { align: "center" });
    }
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(30, 130, pageWidth / 2 - 10, 130);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 100, 150);
    doc.text("ISSUER DETAILS", centerX / 2, 140, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(data.issuerDetails.organization, centerX / 2, 147, { align: "center" });
    doc.text(data.issuerDetails.address, centerX / 2, 152, { align: "center" });
    if (data.issuerDetails.website) {
        doc.text(data.issuerDetails.website, centerX / 2, 157, { align: "center" });
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth / 2 + 10, 130, pageWidth - 30, 130);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 100, 150);
    doc.text("CERTIFICATE DETAILS", pageWidth - centerX / 2, 140, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Certificate ID: ${data.certificateId}`, pageWidth - centerX / 2, 147, { align: "center" });
    doc.text(`Unique ID: ${data.uniqueCertificateId}`, pageWidth - centerX / 2, 152, { align: "center" });
    doc.text(`Status: ${data.status.toUpperCase()}`, pageWidth - centerX / 2, 157, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 100, 150);
    doc.text("VERIFICATION", centerX, 165, { align: "center" });
    doc.setFont("courier", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    const hashPreview = data.certificateHash.substring(0, 40) + "...";
    doc.text(`SHA-256: ${hashPreview}`, centerX, 170, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Blockchain: ${data.blockchainNetwork}`, centerX, 175, { align: "center" });
    if (data.blockchainTxHash) {
        const txPreview = data.blockchainTxHash.substring(0, 30) + "...";
        doc.text(`TX: ${txPreview}`, centerX, 179, { align: "center" });
    }
    if (data.qrCode) {
        try {
            const qrImage = data.qrCode.replace(/^data:image\/\w+;base64,/, "");
            doc.addImage(qrImage, "PNG", pageWidth - 35, pageHeight - 45, 25, 25);
        }
        catch (error) {
            logger_js_1.default.warn("Failed to add QR code to PDF:", error);
        }
    }
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This certificate can be verified at: certchain.vercel.app/verify", centerX, pageHeight - 15, { align: "center" });
    doc.setFontSize(6);
    doc.text(`Generated: ${new Date().toISOString()} | CertChain v2.0`, centerX, pageHeight - 10, { align: "center" });
    const pdfBuffer = doc.output("arraybuffer");
    return Buffer.from(pdfBuffer);
};
const generateCertificatePDF = async (data) => {
    try {
        logger_js_1.default.info(`Generating PDF for certificate: ${data.certificateId}`);
        return await generatePDF(data);
    }
    catch (error) {
        logger_js_1.default.error("Failed to generate PDF:", error);
        throw new Error("Failed to generate certificate PDF");
    }
};
exports.generateCertificatePDF = generateCertificatePDF;
const generateCertificatePDFBase64 = async (data) => {
    const buffer = await (0, exports.generateCertificatePDF)(data);
    return buffer.toString("base64");
};
exports.generateCertificatePDFBase64 = generateCertificatePDFBase64;
exports.default = {
    generateCertificatePDF: exports.generateCertificatePDF,
    generateCertificatePDFBase64: exports.generateCertificatePDFBase64,
};
//# sourceMappingURL=pdf.js.map