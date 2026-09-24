import { Router } from "express";
import * as addressController from "../controllers/addressController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", addressController.listAddresses);
router.post("/", addressController.addAddress);
router.patch("/:addressId", addressController.updateAddress);
router.delete("/:addressId", addressController.deleteAddress);

export default router;
