import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User.js";
export interface AuthRequest extends Request {
    user?: IUser;
    userId?: string;
    userRole?: string;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireOrganization: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map