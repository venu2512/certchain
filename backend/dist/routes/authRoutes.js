"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const index_js_1 = require("../validations/index.js");
const router = (0, express_1.Router)();
router.post("/register", (0, validation_js_1.validateBody)(index_js_1.registerSchema), authController_js_1.register);
router.post("/login", (0, validation_js_1.validateBody)(index_js_1.loginSchema), authController_js_1.login);
router.get("/profile", auth_js_1.authenticate, authController_js_1.getProfile);
router.put("/profile", auth_js_1.authenticate, authController_js_1.updateProfile);
router.post("/change-password", auth_js_1.authenticate, authController_js_1.changePassword);
router.post("/logout", auth_js_1.authenticate, authController_js_1.logout);
router.get("/users", auth_js_1.authenticate, auth_js_1.requireAdmin, authController_js_1.getAllUsers);
router.patch("/users/:userId/toggle", auth_js_1.authenticate, auth_js_1.requireAdmin, authController_js_1.toggleUserStatus);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map