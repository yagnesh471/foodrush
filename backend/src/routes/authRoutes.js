import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiters.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(authLimiter);

router.post("/signup", otpLimiter, authController.signup);
router.post("/resend-otp", otpLimiter, authController.resendOtp);
router.post("/verify-signup", authController.verifySignup);
router.post("/login", authController.login);
router.post("/forgot-password", otpLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", requireAuth, authController.getCurrentUser);

export default router;
