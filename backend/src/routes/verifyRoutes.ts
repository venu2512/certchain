import { Router } from "express";
import {
  verifyCertificate,
  verifyByHash,
  publicVerify,
} from "../controllers/certificateController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:certificateId", verifyCertificate);
router.get("/hash/:hash", verifyByHash);

router.get("/public/verify", publicVerify);

export default router;