import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import logger, { stream } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(morgan("combined", { stream }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

let server: ReturnType<typeof app.listen> | null = null;
let isServerStarted = false;

const startServer = async (port: number = PORT): Promise<void> => {
  if (isServerStarted) {
    logger.warn("Server already started, skipping...");
    return;
  }
  isServerStarted = true;

  try {
    await connectDB();
    logger.info("Database connected successfully");

    server = app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        const newPort = port + 1;
        logger.warn(`Port ${port} is in use. Trying port ${newPort}...`);
        server = null;
        startServer(newPort);
      } else {
        logger.error("Server error:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

startServer();

export default app;