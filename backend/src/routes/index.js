import { Router } from "express";
import authRoutes from "./authRoutes.js";
import foodRoutes from "./foodRoutes.js";
import orderRoutes from "./orderRoutes.js";
import addressRoutes from "./addressRoutes.js";
import adminRoutes from "./adminRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/foods", foodRoutes);
router.use("/orders", orderRoutes);
router.use("/addresses", addressRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);

router.get("/", (_req, res) => {
  res.json({ success: true, message: "FoodRush API Running 🚀" });
});

export default router;
