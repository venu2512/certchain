import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "../models/User.js";
import { IUser } from "../models/User.js";

interface AuthRequest extends Request {
  user?: IUser;
}

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    const user = new User({
      username: username.toLowerCase(),
      password,
      role: role || "user",
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username) {
      res.status(400).json({ error: "Username is required" });
      return;
    }

    let user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      // Auto-create user for demo purposes
      user = new User({
        username: username.toLowerCase(),
        password: password || "demo123",
        role: username.toLowerCase().includes("admin") ? "admin" : "user",
      });
      await user.save();
    }

    // If password is provided, check it; otherwise allow login (for demo/guest access)
    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
    }

    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
    };
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "default-secret",
      signOptions
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
