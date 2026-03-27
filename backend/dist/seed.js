"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_js_1 = __importDefault(require("./models/User.js"));
dotenv_1.default.config();
const seedAdmin = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/certchain");
        console.log("Connected to MongoDB");
        const adminExists = await User_js_1.default.findOne({ username: "admin" });
        if (adminExists) {
            console.log("Admin user already exists");
        }
        else {
            const admin = new User_js_1.default({
                username: "admin",
                password: "admin123",
                role: "admin",
            });
            await admin.save();
            console.log("Admin user created: admin / admin123");
        }
        await mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
    }
    catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};
seedAdmin();
//# sourceMappingURL=seed.js.map