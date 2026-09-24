import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/favorites", userController.getFavorites);
router.post("/favorites/:foodId", userController.toggleFavorite);
router.patch("/profile", userController.updateProfile);
router.patch("/password", userController.changePassword);
router.delete("/profile", userController.deleteAccount);

export default router;

