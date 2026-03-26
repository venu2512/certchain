import { Router } from "express";
import {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  verifyCertificate,
  updateCertificate,
  deleteCertificate,
} from "../controllers/certificateController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/verify/:chainId", verifyCertificate);

router.use(authenticate);

router.get("/", getAllCertificates);
router.get("/:chainId", getCertificateById);

router.post("/", requireAdmin, createCertificate);
router.put("/:chainId", requireAdmin, updateCertificate);
router.delete("/:chainId", requireAdmin, deleteCertificate);

export default router;
