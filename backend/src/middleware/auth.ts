import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";

interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication token required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "certchain-secret-key-change-in-production"
    ) as JwtPayload;

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401).json({ error: "User not found or account deactivated" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    req.user = user;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({
        error: "Access denied",
        message: `This action requires one of the following roles: ${roles.join(", ")}`,
      });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole("admin");
export const requireOrganization = requireRole("organization", "admin");
export const requireAnyAuth = requireRole("admin", "organization", "user");

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "certchain-secret-key-change-in-production"
    ) as JwtPayload;
    User.findById(decoded.id).select("-password").then((user) => {
      if (user) {
        req.user = user;
        req.userId = decoded.id;
        req.userRole = decoded.role;
      }
      next();
    });
  } catch {
    next();
  }
};