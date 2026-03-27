"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get("/", auth_js_1.authenticate, auth_js_1.requireAdmin, authController_js_1.getAllUsers);
router.patch("/:userId/status", auth_js_1.authenticate, auth_js_1.requireAdmin, authController_js_1.toggleUserStatus);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map