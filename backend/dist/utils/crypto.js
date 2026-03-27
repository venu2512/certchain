"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = exports.generateUniqueCertificateId = exports.generateRandomId = exports.verifyDigitalSignature = exports.generateDigitalSignature = exports.generateCertificateHash = exports.generateSHA256Hash = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateSHA256Hash = (data) => {
    return crypto_1.default.createHash("sha256").update(data).digest("hex");
};
exports.generateSHA256Hash = generateSHA256Hash;
const generateCertificateHash = (certificateId, recipientName, recipientEmail, courseName, issueDate, issuer, organization) => {
    const data = [
        certificateId,
        recipientName,
        recipientEmail,
        courseName,
        issueDate.toISOString(),
        issuer,
        organization,
    ].join("|");
    return (0, exports.generateSHA256Hash)(data);
};
exports.generateCertificateHash = generateCertificateHash;
const generateDigitalSignature = (certificateHash, privateKey) => {
    const sign = crypto_1.default.createSign("SHA256");
    sign.update(certificateHash);
    sign.end();
    return sign.sign(privateKey, "hex");
};
exports.generateDigitalSignature = generateDigitalSignature;
const verifyDigitalSignature = (certificateHash, signature, publicKey) => {
    const verify = crypto_1.default.createVerify("SHA256");
    verify.update(certificateHash);
    verify.end();
    return verify.verify(publicKey, signature);
};
exports.verifyDigitalSignature = verifyDigitalSignature;
const generateRandomId = (prefix = "CERT") => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = crypto_1.default.randomBytes(6).toString("hex").toUpperCase();
    return `${prefix}-${timestamp}-${randomPart}`;
};
exports.generateRandomId = generateRandomId;
const generateUniqueCertificateId = () => {
    const uuid = crypto_1.default.randomUUID().replace(/-/g, "").toUpperCase();
    return `CERT-${uuid.substring(0, 16)}`;
};
exports.generateUniqueCertificateId = generateUniqueCertificateId;
const hashPassword = async (password) => {
    const salt = crypto_1.default.randomBytes(16).toString("hex");
    const hash = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, storedHash) => {
    const [salt, hash] = storedHash.split(":");
    const verifyHash = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return hash === verifyHash;
};
exports.verifyPassword = verifyPassword;
//# sourceMappingURL=crypto.js.map