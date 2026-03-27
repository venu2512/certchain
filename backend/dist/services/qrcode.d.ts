export interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}
export declare const generateQRCode: (data: string, options?: QRCodeOptions) => Promise<string>;
export declare const generateVerificationQRCode: (certificateId: string, verificationUrl?: string) => Promise<string>;
export declare const generateCertificateQRCode: (certificateId: string, recipientName: string, courseName: string) => Promise<string>;
export declare const validateQRCode: (qrData: string) => Promise<{
    valid: boolean;
    data?: any;
    error?: string;
}>;
declare const _default: {
    generateQRCode: (data: string, options?: QRCodeOptions) => Promise<string>;
    generateVerificationQRCode: (certificateId: string, verificationUrl?: string) => Promise<string>;
    generateCertificateQRCode: (certificateId: string, recipientName: string, courseName: string) => Promise<string>;
    validateQRCode: (qrData: string) => Promise<{
        valid: boolean;
        data?: any;
        error?: string;
    }>;
};
export default _default;
//# sourceMappingURL=qrcode.d.ts.map