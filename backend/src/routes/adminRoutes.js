import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { adminLoginLimiter } from "../middleware/rateLimiters.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/login", adminLoginLimiter, adminController.adminLogin);

router.use(requireAdmin);

router.get("/stats", adminController.getStats);
router.get("/orders", adminController.listAllOrders);
router.patch("/orders/:orderId", adminController.updateOrderStatus);
router.post("/foods", adminController.createFood);
router.patch("/foods/:id", adminController.updateFood);
router.delete("/foods/:id", adminController.deleteFood);
router.get("/coupons", adminController.getCoupons);
router.post("/coupons", adminController.createCoupon);

export default router;
