import { Router } from "express";
import {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  revokeCertificate,
  deleteCertificate,
  getCertificateStats,
  downloadCertificate,
  verifyCertificate,
} from "../controllers/certificateController.js";
import { authenticate, requireAdmin, requireOrganization, requireAnyAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validation.js";
import { certificateSchema, updateCertificateSchema } from "../validations/index.js";

const router = Router();

router.get("/stats", getCertificateStats);

router.get(
  "/",
  authenticate,
  requireAnyAuth,
  getAllCertificates
);

router.get(
  "/verify/:certificateId",
  verifyCertificate
);

router.get(
  "/:certificateId",
  authenticate,
  requireAnyAuth,
  getCertificateById
);

router.post(
  "/",
  authenticate,
  requireOrganization,
  validateBody(certificateSchema),
  createCertificate
);

router.put(
  "/:certificateId",
  authenticate,
  requireAnyAuth,
  validateBody(updateCertificateSchema),
  updateCertificate
);

router.post(
  "/:certificateId/revoke",
  authenticate,
  requireAdmin,
  revokeCertificate
);

router.delete(
  "/:certificateId",
  authenticate,
  requireAdmin,
  deleteCertificate
);

router.get(
  "/:certificateId/download",
  authenticate,
  requireAnyAuth,
  downloadCertificate
);

export default router;