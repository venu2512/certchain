// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertChain {
    address public admin;
    uint256 public totalCertificates;
    
    struct Certificate {
        string name;
        string course;
        string ipfsCID;
        uint256 timestamp;
        address issuer;
        bool exists;
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
        string calldata ipfsCID
    ) external onlyAuthorized {
        require(!certificates[certID].exists, "Certificate already exists");
        
        certificates[certID] = Certificate({
            name: recipientName,
            course: courseName,
            ipfsCID: ipfsCID,
            timestamp: block.timestamp,
            issuer: msg.sender,
            exists: true
        });
        
        totalCertificates++;
        
        emit CertificateIssued(certID, msg.sender, block.timestamp);
    }
    
    function verifyCertificate(
        string calldata certID
    ) external view returns (
        string memory name,
        string memory course,
        string memory ipfsCID,
        uint256 timestamp,
        address issuer,
        bool exists
    ) {
        Certificate memory cert = certificates[certID];
        require(cert.exists, "Certificate does not exist");
        
        return (
            cert.name,
            cert.course,
            cert.ipfsCID,
            cert.timestamp,
            cert.issuer,
            cert.exists
        );
    }
    
    function revokeCertificate(
        string calldata certID
    ) external onlyAuthorized {
        require(certificates[certID].exists, "Certificate does not exist");
        
        certificates[certID].exists = false;
        
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
        return certificates[certID].exists;
    }
}