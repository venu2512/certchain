import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/certchain");
    console.log("Connected to MongoDB");

    const adminExists = await User.findOne({ username: "admin" });
    if (adminExists) {
      console.log("Admin user already exists");
    } else {
      const admin = new User({
        username: "admin",
        password: "admin123",
        role: "admin",
      });
      await admin.save();
      console.log("Admin user created: admin / admin123");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedAdmin();
