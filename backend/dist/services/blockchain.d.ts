import { Contract, JsonRpcProvider } from "ethers";
export type BlockchainNetwork = "ethereum-sepolia" | "polygon-mumbai" | "ethereum-mainnet";
export declare class BlockchainService {
    private provider;
    private wallet;
    private contract;
    private network;
    constructor(network?: BlockchainNetwork);
    getBlockNumber(): Promise<number>;
    getGasPrice(): Promise<bigint>;
    getNetworkChainId(): Promise<number>;
    getContractAdmin(): Promise<string>;
    getTotalCertificates(): Promise<number>;
    issueCertificate(certID: string, recipientName: string, courseName: string, issuingOrganization: string): Promise<{
        txHash: string;
        blockNumber: number;
    }>;
    revokeCertificate(certID: string): Promise<{
        txHash: string;
        blockNumber: number;
    }>;
    verifyCertificate(certID: string): Promise<{
        isValid: boolean;
        recipientName: string;
        courseName: string;
        issuingOrganization: string;
        issueDate: Date;
        certHash: string;
    }>;
    transferAdmin(newAdmin: string): Promise<{
        txHash: string;
    }>;
    storeCertificateHash(certID: string, certificateHash: string): Promise<string>;
    getReadOnlyProvider(): JsonRpcProvider;
    getContract(): Contract;
}
export declare const blockchainService: BlockchainService;
export default blockchainService;
//# sourceMappingURL=blockchain.d.ts.map