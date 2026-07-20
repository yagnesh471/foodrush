const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { sendEmail } = require("../utils/notify");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: { message: "Too many requests. Please try again later." },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: "Too many OTP requests. Please wait and try again." },
});

router.use(authLimiter);

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeUsername = (username) => String(username || "").trim();
const normalizePhone = (phone) => String(phone || "").trim();

function validatePassword(password) {
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  return null;
}

const tokenFor = (user) =>
  jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

router.post("/signup", otpLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);
    const password = req.body.password;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: "Enter valid 10 digit mobile number" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const exists = await User.findOne({ $or: [{ username }, { email }] });

    if (exists && !exists.isVerified) {
      await User.deleteOne({ _id: exists._id });
    } else if (exists) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const otp = makeOtp();

    await User.create({
      username,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      isVerified: false,
    });

    await sendEmail(email, "FoodRush Signup OTP", `Your FoodRush signup OTP is ${otp}. It expires in 10 minutes.`);

    res.status(201).json({ message: "OTP sent to your email. Please verify your account.", email });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/resend-otp", otpLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Account is already verified" });

    const otp = makeOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(
  user.email,
  "Verify Your FoodRush Account 🍔",
  `
Hello ${user.username},

Welcome to FoodRush! 🎉

Your One-Time Password (OTP) for account verification is:

🔐 OTP: ${otp}

This OTP is valid for 10 minutes.

Please do not share this code with anyone for security reasons.

Thank you for choosing FoodRush 🍔
Delicious food, delivered fast 🚀

— Team FoodRush
`
);
    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
});

router.post("/verify-signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await sendEmail(
  user.email,
  "Welcome to FoodRush 🍔 | Account Verified Successfully",
  `
Hello ${user.username},

🎉 Congratulations! Your FoodRush account has been verified successfully.

You can now:

🍔 Browse delicious food items
🛒 Place orders instantly
🗺️ Track deliveries live
💳 Enjoy secure payments

Thank you for joining FoodRush.

We’re excited to deliver your favorite meals fast and fresh 🚀

Happy Ordering!

— Team FoodRush
`
);

    res.json({
      message: "Account verified successfully",
      user: { username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Verify signup error:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Username not found" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your account before login" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Incorrect password" });

    res.json({
      message: "Login successful",
      token: tokenFor(user),
      user: { username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const otp = makeOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(
  user.email,
  "Reset Your FoodRush Password 🔐",
  `
Hello ${user.username},

We received a request to reset your FoodRush account password.

Your One-Time Password (OTP) for password reset is:

🔐 OTP: ${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, please ignore this email and your account will remain secure.

Thank you for using FoodRush 🍔
Fast delivery. Fresh food. Anytime 🚀

— Team FoodRush
`
);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const newPassword = req.body.newPassword;

    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await sendEmail(
  user.email,
  "FoodRush Password Updated Successfully 🔐",
  `
Hello ${user.username},

Your FoodRush account password has been changed successfully ✅

If you made this change, no further action is required.

If you did NOT change your password, please reset it immediately or contact support as your account may be at risk.

Thank you for choosing FoodRush 🍔
Delivering happiness to your doorstep 🚀

— Team FoodRush
`
);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Password reset failed" });
  }
});

module.exports = router;
