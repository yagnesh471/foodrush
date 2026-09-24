import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOtp } from "../utils/generators.js";
import { signUserToken } from "../utils/token.js";
import {
  sendSignupOtpEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendPasswordResetLinkEmail,
} from "../services/emailService.js";
import crypto from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeUsername = (username) => String(username || "").trim();
const normalizePhone = (phone) => String(phone || "").trim();

const assertValidPassword = (password) => {
  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
};

const publicUser = (user) => ({ username: user.username, email: user.email, phone: user.phone });

export const signup = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const { password } = req.body;

  if (!username || !email || !phone || !password) {
    throw new ApiError(400, "All fields are required");
  }
  if (username.length < 3) {
    throw new ApiError(400, "Username must be at least 3 characters");
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    throw new ApiError(400, "Enter a valid 10 digit mobile number");
  }
  assertValidPassword(password);

  const existing = await User.findOne({ $or: [{ username }, { email }] });

  if (existing && !existing.isVerified) {
    await User.deleteOne({ _id: existing._id });
  } else if (existing) {
    throw new ApiError(409, "Username or email already exists");
  }

  const otp = generateOtp();

  const user = await User.create({
    username,
    email,
    phone,
    password: await bcrypt.hash(password, 10),
    otp,
    otpExpires: new Date(Date.now() + OTP_TTL_MS),
    isVerified: false,
  });

  await sendSignupOtpEmail(user, otp);

  res.status(201).json({ message: "OTP sent to your email. Please verify your account.", email });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) throw new ApiError(400, "Account is already verified");

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save();

  await sendSignupOtpEmail(user, otp);

  res.json({ message: "OTP resent successfully" });
});

export const verifySignup = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  await sendWelcomeEmail(user);

  res.json({ message: "Account verified successfully", user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const identifier = String(req.body.username || req.body.email || "").trim();
  const { password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "Username/Email and password are required");
  }

  const user = await User.findOne({
    $or: [
      { username: identifier },
      { email: identifier.toLowerCase() }
    ]
  });
  
  if (!user) throw new ApiError(404, "Account not found");
  if (!user.isVerified) throw new ApiError(403, "Please verify your account before login");

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) throw new ApiError(401, "Incorrect password");

  res.json({
    message: "Login successful",
    token: signUserToken(user),
    user: publicUser(user),
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "Email not found");

  const token = crypto.randomBytes(32).toString("hex");
  user.otp = token;
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save();

  await sendPasswordResetLinkEmail(user, token);

  res.json({ message: "Password reset link sent to your email" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const token = String(req.body.token || "").trim();
  const { newPassword } = req.body;

  assertValidPassword(newPassword);

  const user = await User.findOne({ email });
  if (!user || user.otp !== token || !user.otpExpires || user.otpExpires < new Date()) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  await sendPasswordChangedEmail(user);

  res.json({ message: "Password reset successful" });
});

// Lets the SPA restore a session (e.g. on page refresh) from a stored
// token without re-sending credentials.
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
