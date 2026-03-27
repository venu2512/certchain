// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertChain {
    address public admin;
    uint256 public totalCertificates;
    
    struct Certificate {
        bool exists;
        bool isValid;
        string recipientName;
        string courseName;
        string issuingOrganization;
        uint256 issueDate;
        bytes32 certificateHash;
        string metadata;
    }
    
    mapping(string => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;
    
    event CertificateIssued(
        string indexed certID,
        address indexed issuer,
        uint256 timestamp
    );
    
    event CertificateRevoked(
        string indexed certID,
        address indexed revoker,
        uint256 timestamp
    );
    
    event AdminTransferred(
        address indexed oldAdmin,
        address indexed newAdmin
    );
    
    event IssuerAuthorized(
        address indexed issuer
    );
    
    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == admin,
            "Only authorized issuers can perform this action"
        );
        _;
    }
    
    function issueCertificate(
        string calldata certID,
        string calldata recipientName,
        string calldata courseName,
        string calldata issuingOrganization,
        bytes32 certificateHash,
        string calldata metadata
    ) external onlyAuthorized {
        require(!certificates[certID].exists, "Certificate already exists");
        
        certificates[certID] = Certificate({
            exists: true,
            isValid: true,
            recipientName: recipientName,
            courseName: courseName,
            issuingOrganization: issuingOrganization,
            issueDate: block.timestamp,
            certificateHash: certificateHash,
            metadata: metadata
        });
        
        totalCertificates++;
        
        emit CertificateIssued(certID, msg.sender, block.timestamp);
    }
    
    function verifyCertificate(
        string calldata certID
    ) external view returns (
        bool isValid,
        string memory recipientName,
        string memory courseName,
        string memory issuingOrganization,
        uint256 issueDate,
        bytes32 certHash,
        string memory metadata
    ) {
        Certificate memory cert = certificates[certID];
        require(cert.exists, "Certificate does not exist");
        
        return (
            cert.isValid,
            cert.recipientName,
            cert.courseName,
            cert.issuingOrganization,
            cert.issueDate,
            cert.certificateHash,
            cert.metadata
        );
    }
    
    function verifyByHash(
        bytes32 certificateHash
    ) external view returns (
        bool isValid,
        string memory certID,
        string memory recipientName,
        string memory courseName
    ) {
        for (uint256 i = 0; i < totalCertificates; i++) {
            Certificate storage cert = certificates[getCertIdByIndex(i)];
            if (cert.certificateHash == certificateHash) {
                return (
                    cert.isValid,
                    getCertIdByIndex(i),
                    cert.recipientName,
                    cert.courseName
                );
            }
        }
        return (false, "", "", "");
    }
    
    function getCertIdByIndex(uint256 index) internal pure returns (string memory) {
        return "";
    }
    
    function revokeCertificate(
        string calldata certID
    ) external onlyAuthorized {
        require(certificates[certID].exists, "Certificate does not exist");
        require(certificates[certID].isValid, "Certificate already revoked");
        
        certificates[certID].isValid = false;
        
        emit CertificateRevoked(certID, msg.sender, block.timestamp);
    }
    
    function transferAdmin(
        address newAdmin
    ) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        
        address oldAdmin = admin;
        admin = newAdmin;
        authorizedIssuers[newAdmin] = true;
        
        emit AdminTransferred(oldAdmin, newAdmin);
    }
    
    function authorizeIssuer(
        address issuer
    ) external onlyAdmin {
        require(issuer != address(0), "Invalid issuer address");
        
        authorizedIssuers[issuer] = true;
        
        emit IssuerAuthorized(issuer);
    }
    
    function getCertificateCount() external view returns (uint256) {
        return totalCertificates;
    }
    
    function isCertificateValid(
        string calldata certID
    ) external view returns (bool) {
        return certificates[certID].exists && certificates[certID].isValid;
    }
}