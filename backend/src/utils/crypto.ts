import crypto from "crypto";

export const generateSHA256Hash = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const generateCertificateHash = (
  certificateId: string,
  recipientName: string,
  recipientEmail: string,
  courseName: string,
  issueDate: Date,
  issuer: string,
  organization: string
): string => {
  const data = [
    certificateId,
    recipientName,
    recipientEmail,
    courseName,
    issueDate.toISOString(),
    issuer,
    organization,
  ].join("|");
  return generateSHA256Hash(data);
};

export const generateDigitalSignature = (certificateHash: string, privateKey: string): string => {
  const sign = crypto.createSign("SHA256");
  sign.update(certificateHash);
  sign.end();
  return sign.sign(privateKey, "hex");
};

export const verifyDigitalSignature = (
  certificateHash: string,
  signature: string,
  publicKey: string
): boolean => {
  const verify = crypto.createVerify("SHA256");
  verify.update(certificateHash);
  verify.end();
  return verify.verify(publicKey, signature);
};

export const generateRandomId = (prefix: string = "CERT"): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
};

export const generateUniqueCertificateId = (): string => {
  const uuid = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `CERT-${uuid.substring(0, 16)}`;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === verifyHash;
};