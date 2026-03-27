import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "../models/User.js";
import { AuthRequest, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../config/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "certchain-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const generateToken = (user: any): string => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  
  const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, signOptions);
};

export const register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username, email, password, role, organization, organizationDetails } = req.body;

  const existingUser = await User.findOne({
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

  const user = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    role: role || "user",
    organization,
    organizationDetails,
  });

  await user.save();

  const token = generateToken(user);

  logger.info(`New user registered: ${user.username} with role: ${user.role}`);

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

export const login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const user = await User.findOne({ username: username.toLowerCase() });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is deactivated" });
    return;
  }

  if (password) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  logger.info(`User logged in: ${user.username}`);

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

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).select("-password");
  
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, organization, organizationDetails } = req.body;
  const user = req.user;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    user.email = email.toLowerCase();
  }

  if (organization) user.organization = organization;
  if (organizationDetails) user.organizationDetails = organizationDetails;

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

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  logger.info(`Password changed for user: ${user.username}`);

  res.json({ message: "Password changed successfully" });
});

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, role, search } = req.query;

  const filter: any = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await User.countDocuments(filter);

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

export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const targetUser = await User.findById(userId);
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

  logger.info(`User ${targetUser.username} ${targetUser.isActive ? "activated" : "deactivated"} by ${user.username}`);

  res.json({
    message: `User ${targetUser.isActive ? "activated" : "deactivated"} successfully`,
    user: {
      id: targetUser._id,
      username: targetUser.username,
      isActive: targetUser.isActive,
    },
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`User logged out: ${req.user?.username}`);
  res.json({ message: "Logout successful" });
});