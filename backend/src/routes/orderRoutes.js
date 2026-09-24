import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/timeline-config", orderController.getOrderTimelineConfig);
router.post("/validate-promo", orderController.validatePromo);
router.post("/", orderController.createOrder);
router.get("/mine", orderController.getMyOrders);
router.get("/:orderId", orderController.getOrderById);
router.patch("/:orderId/cancel", orderController.cancelOrder);

export default router;
