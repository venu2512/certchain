"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificateController_js_1 = require("../controllers/certificateController.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const index_js_1 = require("../validations/index.js");
const router = (0, express_1.Router)();
router.get("/stats", certificateController_js_1.getCertificateStats);
router.get("/", auth_js_1.authenticate, auth_js_1.requireAnyAuth, certificateController_js_1.getAllCertificates);
router.get("/verify/:certificateId", certificateController_js_1.verifyCertificate);
router.get("/:certificateId", auth_js_1.authenticate, auth_js_1.requireAnyAuth, certificateController_js_1.getCertificateById);
router.post("/", auth_js_1.authenticate, auth_js_1.requireOrganization, (0, validation_js_1.validateBody)(index_js_1.certificateSchema), certificateController_js_1.createCertificate);
router.put("/:certificateId", auth_js_1.authenticate, auth_js_1.requireAnyAuth, (0, validation_js_1.validateBody)(index_js_1.updateCertificateSchema), certificateController_js_1.updateCertificate);
router.post("/:certificateId/revoke", auth_js_1.authenticate, auth_js_1.requireAdmin, certificateController_js_1.revokeCertificate);
router.delete("/:certificateId", auth_js_1.authenticate, auth_js_1.requireAdmin, certificateController_js_1.deleteCertificate);
router.get("/:certificateId/download", auth_js_1.authenticate, auth_js_1.requireAnyAuth, certificateController_js_1.downloadCertificate);
exports.default = router;
//# sourceMappingURL=certificateRoutes.js.map