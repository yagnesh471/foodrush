import { Router } from "express";
import * as foodController from "../controllers/foodController.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", foodController.listFoods);
router.post("/:id/reviews", requireAuth, foodController.addReview);
router.get("/:id/reviews", foodController.getReviews);

export default router;
