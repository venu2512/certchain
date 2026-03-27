"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificateController_js_1 = require("../controllers/certificateController.js");
const router = (0, express_1.Router)();
router.get("/:certificateId", certificateController_js_1.verifyCertificate);
router.get("/hash/:hash", certificateController_js_1.verifyByHash);
router.get("/public/verify", certificateController_js_1.publicVerify);
exports.default = router;
//# sourceMappingURL=verifyRoutes.js.map