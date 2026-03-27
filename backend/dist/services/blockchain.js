"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = exports.BlockchainService = void 0;
const ethers_1 = require("ethers");
const logger_js_1 = __importDefault(require("../config/logger.js"));
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "0xb201ed6395741d34c4504105748e14286eFa3486";
const ABI = [
    "constructor()",
    "function admin() view returns (address)",
    "function issueCertificate(string certID, string recipientName, string courseName, string issuingOrganization) returns ()",
    "function verifyCertificate(string certID) view returns (bool isValid, string recipientName, string courseName, string issuingOrganization, uint256 issueDate, bytes32 certHash)",
    "function revokeCertificate(string certID) returns ()",
    "function getTotalCertificates() view returns (uint256)",
    "function transferAdmin(address newAdmin) returns ()"
];
const getNetworkConfig = (network) => {
    const configs = {
        "ethereum-sepolia": {
            rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC || "https://rpc.sepolia.org",
            privateKey: process.env.ETHEREUM_PRIVATE_KEY || "",
            contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS || CONTRACT_ADDRESS,
        },
        "polygon-mumbai": {
            rpcUrl: process.env.POLYGON_MUMBAI_RPC || "https://rpc-mumbai.maticvigil.com",
            privateKey: process.env.POLYGON_PRIVATE_KEY || "",
            contractAddress: process.env.POLYGON_CONTRACT_ADDRESS || CONTRACT_ADDRESS,
        },
        "ethereum-mainnet": {
            rpcUrl: process.env.ETHEREUM_MAINNET_RPC || "https://eth.llamarpc.com",
            privateKey: process.env.ETHEREUM_PRIVATE_KEY || "",
            contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS || CONTRACT_ADDRESS,
        },
    };
    return configs[network];
};
class BlockchainService {
    provider;
    wallet;
    contract;
    network;
    constructor(network = "ethereum-sepolia") {
        this.network = network;
        const config = getNetworkConfig(network);
        this.provider = new ethers_1.JsonRpcProvider(config.rpcUrl);
        if (config.privateKey) {
            this.wallet = new ethers_1.Wallet(config.privateKey, this.provider);
        }
        else {
            this.wallet = null;
        }
        this.contract = new ethers_1.Contract(config.contractAddress, ABI, this.wallet || this.provider);
        logger_js_1.default.info(`Blockchain service initialized: ${network}`);
    }
    async getBlockNumber() {
        return this.provider.getBlockNumber();
    }
    async getGasPrice() {
        return this.provider.getFeeData().then(fee => fee.gasPrice || BigInt(0));
    }
    async getNetworkChainId() {
        const network = await this.provider.getNetwork();
        return Number(network.chainId);
    }
    async getContractAdmin() {
        try {
            return await this.contract.admin();
        }
        catch (error) {
            logger_js_1.default.error("Failed to get contract admin:", error);
            throw error;
        }
    }
    async getTotalCertificates() {
        try {
            const total = await this.contract.getTotalCertificates();
            return Number(total);
        }
        catch (error) {
            logger_js_1.default.error("Failed to get total certificates:", error);
            throw error;
        }
    }
    async issueCertificate(certID, recipientName, courseName, issuingOrganization) {
        if (!this.wallet) {
            throw new Error("Wallet not configured. Set PRIVATE_KEY environment variable.");
        }
        try {
            logger_js_1.default.info(`Issuing certificate on blockchain: ${certID}`);
            const tx = await this.contract.issueCertificate(certID, recipientName, courseName, issuingOrganization);
            const receipt = await tx.wait();
            logger_js_1.default.info(`Certificate issued on blockchain. Tx: ${receipt.hash}, Block: ${receipt.blockNumber}`);
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
            };
        }
        catch (error) {
            logger_js_1.default.error("Failed to issue certificate on blockchain:", error);
            throw error;
        }
    }
    async revokeCertificate(certID) {
        if (!this.wallet) {
            throw new Error("Wallet not configured. Set PRIVATE_KEY environment variable.");
        }
        try {
            logger_js_1.default.info(`Revoking certificate on blockchain: ${certID}`);
            const tx = await this.contract.revokeCertificate(certID);
            const receipt = await tx.wait();
            logger_js_1.default.info(`Certificate revoked on blockchain. Tx: ${receipt.hash}`);
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
            };
        }
        catch (error) {
            logger_js_1.default.error("Failed to revoke certificate on blockchain:", error);
            throw error;
        }
    }
    async verifyCertificate(certID) {
        try {
            const result = await this.contract.verifyCertificate(certID);
            return {
                isValid: result[0],
                recipientName: result[1],
                courseName: result[2],
                issuingOrganization: result[3],
                issueDate: new Date(Number(result[4]) * 1000),
                certHash: result[5],
            };
        }
        catch (error) {
            logger_js_1.default.error(`Failed to verify certificate ${certID}:`, error);
            throw error;
        }
    }
    async transferAdmin(newAdmin) {
        if (!this.wallet) {
            throw new Error("Wallet not configured. Set PRIVATE_KEY environment variable.");
        }
        try {
            const tx = await this.contract.transferAdmin(newAdmin);
            const receipt = await tx.wait();
            logger_js_1.default.info(`Admin transferred to: ${newAdmin}`);
            return { txHash: receipt.hash };
        }
        catch (error) {
            logger_js_1.default.error("Failed to transfer admin:", error);
            throw error;
        }
    }
    async storeCertificateHash(certID, certificateHash) {
        if (!this.wallet) {
            throw new Error("Wallet not configured. Set PRIVATE_KEY environment variable.");
        }
        try {
            const tx = await this.contract.issueCertificate(certID, certificateHash, "CERTIFICATE_HASH", "CertChain Verification System");
            const receipt = await tx.wait();
            return receipt.hash;
        }
        catch (error) {
            logger_js_1.default.error("Failed to store certificate hash:", error);
            throw error;
        }
    }
    getReadOnlyProvider() {
        return this.provider;
    }
    getContract() {
        return this.contract;
    }
}
exports.BlockchainService = BlockchainService;
exports.blockchainService = new BlockchainService();
exports.default = exports.blockchainService;
//# sourceMappingURL=blockchain.js.map