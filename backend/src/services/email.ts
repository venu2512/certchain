import axios from "axios";
import logger from "../config/logger.js";

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

class EmailService {
  private config: SendGridConfig | null = null;
  private provider: "sendgrid" | "brevo" | "none" = "none";

  initialize(): void {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (sendgridApiKey) {
      this.provider = "sendgrid";
      this.config = {
        apiKey: sendgridApiKey,
        fromEmail: process.env.EMAIL_FROM || "noreply@certchain.app",
        fromName: process.env.EMAIL_FROM_NAME || "CertChain",
      };
      logger.info("Email service initialized with SendGrid");
    } else if (brevoApiKey) {
      this.provider = "brevo";
      this.config = {
        apiKey: brevoApiKey,
        fromEmail: process.env.EMAIL_FROM || "noreply@certchain.app",
        fromName: process.env.EMAIL_FROM_NAME || "CertChain",
      };
      logger.info("Email service initialized with Brevo");
    } else {
      logger.warn("No email provider configured. Email sending disabled.");
    }
  }

  async sendCertificateEmail(
    to: string,
    recipientName: string,
    certificateId: string,
    courseName: string,
    pdfBase64?: string
  ): Promise<boolean> {
    if (!this.config) {
      logger.warn("Email service not configured");
      return false;
    }

    const subject = `Your Certificate of Completion - ${courseName}`;
    const verificationUrl = `${process.env.VERIFICATION_URL || "https://certchain.vercel.app/verify"}?cert=${certificateId}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0096c7, #0066cc); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">CERT<strong>CHAIN</strong></h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Blockchain Certificate System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0;">Congratulations, ${recipientName}!</h2>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                      Your certificate of completion for <strong>${courseName}</strong> has been issued and is now available.
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0;"><strong style="color: #0096c7;">Certificate ID:</strong> ${certificateId}</p>
                      <p style="margin: 0;"><strong style="color: #0096c7;">Course:</strong> ${courseName}</p>
                    </div>
                    
                    <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td style="background-color: #0096c7; border-radius: 6px;">
                          <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: bold;">Verify Certificate</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #999999; font-size: 12px; margin: 30px 0 0 0;">
                      You can also download your certificate PDF from the verification page.
                      This certificate is secured with SHA-256 hashing and stored on the blockchain for permanent verification.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                    <p style="color: #999999; font-size: 11px; margin: 0;">
                      This is an automated message from CertChain. Please do not reply to this email.
                    </p>
                    <p style="color: #cccccc; font-size: 10px; margin: 10px 0 0 0;">
                      &copy; ${new Date().getFullYear()} CertChain - Blockchain Certificate Verification System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.send({
      to,
      subject,
      html,
    });
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.config) {
      logger.warn("Email service not configured");
      return false;
    }

    try {
      if (this.provider === "sendgrid") {
        return await this.sendWithSendGrid(options);
      } else if (this.provider === "brevo") {
        return await this.sendWithBrevo(options);
      }
      return false;
    } catch (error) {
      logger.error("Failed to send email:", error);
      return false;
    }
  }

  private async sendWithSendGrid(options: EmailOptions): Promise<boolean> {
    const url = "https://api.sendgrid.com/v3/mail/send";
    
    const payload = {
      personalizations: [
        {
          to: [{ email: options.to }],
        },
      ],
      from: {
        email: this.config!.fromEmail,
        name: this.config!.fromName,
      },
      subject: options.subject,
      content: [
        {
          type: "text/plain",
          value: options.text || options.html?.replace(/<[^>]*>/g, "") || "",
        },
        {
          type: "text/html",
          value: options.html || "",
        },
      ],
    };

    if (options.attachments && options.attachments.length > 0) {
      (payload as any).attachments = options.attachments.map((att) => ({
        content: att.content,
        filename: att.filename,
        type: att.type,
      }));
    }

    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  }

  private async sendWithBrevo(options: EmailOptions): Promise<boolean> {
    const url = "https://api.brevo.com/v3/smtp/email";

    const payload = {
      sender: {
        name: this.config!.fromName,
        email: this.config!.fromEmail,
      },
      to: [
        {
          email: options.to,
        },
      ],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
    };

    if (options.attachments && options.attachments.length > 0) {
      (payload as any).attachment = options.attachments.map((att) => ({
        name: att.filename,
        content: att.content,
      }));
    }

    await axios.post(url, payload, {
      headers: {
        "api-key": this.config!.apiKey,
        "Content-Type": "application/json",
      },
    });

    logger.info(`Email sent to ${options.to} via Brevo: ${options.subject}`);
    return true;
  }
}

export const emailService = new EmailService();
emailService.initialize();

export default emailService;