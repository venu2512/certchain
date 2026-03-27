import { Request, Response, NextFunction } from "express";
export declare const getAllCertificates: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCertificateById: (req: Request, res: Response, next: NextFunction) => void;
export declare const createCertificate: (req: Request, res: Response, next: NextFunction) => void;
export declare const verifyCertificate: (req: Request, res: Response, next: NextFunction) => void;
export declare const verifyByHash: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateCertificate: (req: Request, res: Response, next: NextFunction) => void;
export declare const revokeCertificate: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteCertificate: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCertificateStats: (req: Request, res: Response, next: NextFunction) => void;
export declare const downloadCertificate: (req: Request, res: Response, next: NextFunction) => void;
export declare const publicVerify: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=certificateController.d.ts.map