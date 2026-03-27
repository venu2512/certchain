"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.toggleUserStatus = exports.getAllUsers = exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = __importDefault(require("../models/User.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const logger_js_1 = __importDefault(require("../config/logger.js"));
const JWT_SECRET = process.env.JWT_SECRET || "certchain-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const generateToken = (user) => {
    const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
    };
    const signOptions = { expiresIn: JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, signOptions);
};
exports.register = (0, errorHandler_js_1.asyncHandler)(async (req, res, next) => {
    const { username, email, password, role, organization, organizationDetails } = req.body;
    const existingUser = await User_js_1.default.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });
    if (existingUser) {
        res.status(409).json({ error: "Username or email already exists" });
        return;
    }
    if (role === "admin" && req.userRole !== "admin") {
        res.status(403).json({ error: "Cannot create admin users" });
        return;
    }
    const user = new User_js_1.default({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        role: role || "user",
        organization,
        organizationDetails,
    });
    await user.save();
    const token = generateToken(user);
    logger_js_1.default.info(`New user registered: ${user.username} with role: ${user.role}`);
    res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            organization: user.organization,
        },
    });
});
exports.login = (0, errorHandler_js_1.asyncHandler)(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
    }
    const user = await User_js_1.default.findOne({ username: username.toLowerCase() });
    if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    if (!user.isActive) {
        res.status(403).json({ error: "Account is deactivated" });
        return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    logger_js_1.default.info(`User logged in: ${user.username}`);
    res.json({
        message: "Login successful",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            organization: user.organization,
        },
    });
});
exports.getProfile = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await User_js_1.default.findById(req.user?._id).select("-password");
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json({ user });
});
exports.updateProfile = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { email, organization, organizationDetails } = req.body;
    const user = req.user;
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (email && email !== user.email) {
        const existingEmail = await User_js_1.default.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            res.status(409).json({ error: "Email already in use" });
            return;
        }
        user.email = email.toLowerCase();
    }
    if (organization)
        user.organization = organization;
    if (organizationDetails)
        user.organizationDetails = organizationDetails;
    await user.save();
    res.json({
        message: "Profile updated successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            organization: user.organization,
        },
    });
});
exports.changePassword = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
    }
    user.password = newPassword;
    await user.save();
    logger_js_1.default.info(`Password changed for user: ${user.username}`);
    res.json({ message: "Password changed successfully" });
});
exports.getAllUsers = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role)
        filter.role = role;
    if (search) {
        filter.$or = [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }
    const users = await User_js_1.default.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
    const total = await User_js_1.default.countDocuments(filter);
    res.json({
        users,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});
exports.toggleUserStatus = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const targetUser = await User_js_1.default.findById(userId);
    if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (userId === user._id.toString()) {
        res.status(400).json({ error: "Cannot deactivate your own account" });
        return;
    }
    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();
    logger_js_1.default.info(`User ${targetUser.username} ${targetUser.isActive ? "activated" : "deactivated"} by ${user.username}`);
    res.json({
        message: `User ${targetUser.isActive ? "activated" : "deactivated"} successfully`,
        user: {
            id: targetUser._id,
            username: targetUser.username,
            isActive: targetUser.isActive,
        },
    });
});
exports.logout = (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    logger_js_1.default.info(`User logged out: ${req.user?.username}`);
    res.json({ message: "Logout successful" });
});
//# sourceMappingURL=authController.js.map