"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAnyAuth = exports.requireOrganization = exports.requireAdmin = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = __importDefault(require("../models/User.js"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Authentication token required" });
            return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "certchain-secret-key-change-in-production");
        const user = await User_js_1.default.findById(decoded.id).select("-password");
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: "Token expired" });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: "Invalid token" });
            return;
        }
        res.status(500).json({ error: "Authentication failed" });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)("admin");
exports.requireOrganization = (0, exports.requireRole)("organization", "admin");
exports.requireAnyAuth = (0, exports.requireRole)("admin", "organization", "user");
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next();
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "certchain-secret-key-change-in-production");
        User_js_1.default.findById(decoded.id).select("-password").then((user) => {
            if (user) {
                req.user = user;
                req.userId = decoded.id;
                req.userRole = decoded.role;
            }
            next();
        });
    }
    catch {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map