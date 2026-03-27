export interface CertificateData {
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
    certificateHash: string;
    digitalSignature: string;
    blockchainTxHash?: string;
    blockchainNetwork: string;
    qrCode?: string;
    status: string;
}
export declare const generateCertificatePDF: (data: CertificateData) => Promise<Buffer>;
export declare const generateCertificatePDFBase64: (data: CertificateData) => Promise<string>;
declare const _default: {
    generateCertificatePDF: (data: CertificateData) => Promise<Buffer>;
    generateCertificatePDFBase64: (data: CertificateData) => Promise<string>;
};
export default _default;
//# sourceMappingURL=pdf.d.ts.map