const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Food = require("../models/Food");
const User = require("../models/User");
const Order = require("../models/Order");
const { sendEmail } = require("../utils/notify");

const router = express.Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many admin login attempts. Try again later." },
});

function adminToken() {
  return jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Admin login required" });
  }
}

async function sendOrderStatusEmail(order) {
  if (!order.email) return;

  if (order.status === "Delivered") {
    await sendEmail(
      order.email,
      "FoodRush Order Delivered Successfully 🎉",
      `Hi ${order.username},

Your order ${order.orderId} has been delivered successfully ✅

Thank you for ordering from FoodRush 🍔

Enjoy your meal!`
    );
    return;
  }

  if (order.status === "Cancelled") {
    await sendEmail(
      order.email,
      "FoodRush Order Cancelled",
      `Hi ${order.username},

Your order ${order.orderId} has been cancelled.

If this was a mistake, please place a new order from FoodRush.`
    );
    return;
  }

  await sendEmail(
    order.email,
    "FoodRush Order Status Updated",
    `Hi ${order.username},

Your order ${order.orderId} status is now: ${order.status}.`
  );
}

router.post("/login", adminLoginLimiter, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    return res.json({
      message: "Admin login successful",
      token: adminToken(),
    });
  }

  res.status(401).json({ message: "Invalid admin credentials" });
});

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/orders", requireAdmin, async (req, res) => {
  try {
    res.json(await Order.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.post("/foods", requireAdmin, async (req, res) => {
  try {
    const food = await Food.create({
      name: String(req.body.name || "").trim(),
      category: String(req.body.category || "").trim(),
      price: Number(req.body.price),
      image_url: String(req.body.image_url || "").trim(),
    });

    res.status(201).json(food);
  } catch (err) {
    res.status(500).json({ message: "Failed to add food" });
  }
});

router.delete("/foods/:id", requireAdmin, async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: "Food deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete food" });
  }
});

router.patch("/orders/:orderId", requireAdmin, async (req, res) => {
  try {
    const allowedStatuses = [
      "Order Placed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status: req.body.status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await sendOrderStatusEmail(order);

    res.json(order);
  } catch (err) {
    console.error("Admin order update error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;