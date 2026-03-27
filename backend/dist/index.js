"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = __importDefault(require("./config/db.js"));
const logger_js_1 = __importStar(require("./config/logger.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const certificateRoutes_js_1 = __importDefault(require("./routes/certificateRoutes.js"));
const verifyRoutes_js_1 = __importDefault(require("./routes/verifyRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
}));
app.use((0, morgan_1.default)("combined", { stream: logger_js_1.stream }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
const limiter = (0, express_rate_limit_1.default)({
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
app.use("/api/auth", authRoutes_js_1.default);
app.use("/api/certificates", certificateRoutes_js_1.default);
app.use("/api/verify", verifyRoutes_js_1.default);
app.use("/api/users", userRoutes_js_1.default);
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
app.use(errorHandler_js_1.errorHandler);
const startServer = async () => {
    try {
        await (0, db_js_1.default)();
        logger_js_1.default.info("Database connected successfully");
        app.listen(PORT, () => {
            logger_js_1.default.info(`Server running on http://localhost:${PORT}`);
            logger_js_1.default.info(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    }
    catch (error) {
        logger_js_1.default.error("Failed to start server:", error);
        process.exit(1);
    }
};
process.on("SIGTERM", () => {
    logger_js_1.default.info("SIGTERM received. Shutting down gracefully...");
    process.exit(0);
});
process.on("SIGINT", () => {
    logger_js_1.default.info("SIGINT received. Shutting down gracefully...");
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map