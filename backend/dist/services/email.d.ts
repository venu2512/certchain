export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: string;
        type: string;
    }>;
}
export interface SendGridConfig {
    apiKey: string;
    fromEmail: string;
    fromName: string;
}
declare class EmailService {
    private config;
    private provider;
    initialize(): void;
    sendCertificateEmail(to: string, recipientName: string, certificateId: string, courseName: string, pdfBase64?: string): Promise<boolean>;
    send(options: EmailOptions): Promise<boolean>;
    private sendWithSendGrid;
    private sendWithBrevo;
}
export declare const emailService: EmailService;
export default emailService;
//# sourceMappingURL=email.d.ts.map