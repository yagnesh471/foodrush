const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const { sendEmail } = require("../utils/notify");

const router = express.Router();

function generateOrderId() {
  return "ORD" + Date.now();
}

router.post("/", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const {
  items,
  subtotal,
  gst,
  deliveryFee,
  totalPrice,
  latitude,
  longitude,
  paymentMethod,
  address,
} = req.body;

    if (!username || !items || !items.length) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const user = await User.findOne({ username });

const order = await Order.create({
  orderId: generateOrderId(),
  username,
  email: user?.email,
  phone: user?.phone,

  address,

  items,
  subtotal,
  gst,
  deliveryFee: deliveryFee ?? 40,
  totalPrice,
  latitude,
  longitude,
  paymentMethod: paymentMethod || "cod",
  paymentStatus: paymentMethod === "cod" ? "COD" : "Paid",
  status: "Order Placed",
});

    await sendEmail(
  order.email,
  "🍔 FoodRush Order Confirmed Successfully",
  `
Hello ${order.username},

🎉 Thank you for ordering with FoodRush!

Your order has been placed successfully and is now being processed.

━━━━━━━━━━━━━━━━━━
🧾 Order Details
━━━━━━━━━━━━━━━━━━

📦 Order ID: ${order.orderId}
💳 Payment Method: ${order.paymentMethod.toUpperCase()}
💰 Total Amount: ₹${order.totalPrice}

🛵 Your delicious food is being prepared and will be delivered shortly.

You can track your order live from the FoodRush tracking page.

Thank you for choosing FoodRush 🍔
Fast delivery. Fresh food. Anytime 🚀

— Team FoodRush
`
);

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

router.get("/user/:username", async (req, res) => {
  try {
    res.json(await Order.find({ username: req.params.username }).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
});

router.patch("/cancel/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["Out for Delivery", "Delivered", "Cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled now" });
    }

    order.status = "Cancelled";
    await order.save();

    await sendEmail(
  order.email,
  "Your FoodRush Order Has Been Cancelled ❌",
  `
Hello ${order.username},

Your FoodRush order has been cancelled successfully.

━━━━━━━━━━━━━━━━━━
🧾 Order Details
━━━━━━━━━━━━━━━━━━

📦 Order ID: ${order.orderId}

If this cancellation was unintentional, you can place a new order anytime through FoodRush.

We apologize for any inconvenience caused.

Thank you for choosing FoodRush 🍔
Fast delivery. Fresh food. Anytime 🚀

— Team FoodRush
`
);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel order" });
  }
});

router.patch("/delivered/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      return res.json({
        message: "Order already delivered",
        order,
      });
    }

    order.status = "Delivered";
    await order.save();

    await sendEmail(
  order.email,
  "🍔 Your FoodRush Order Has Been Delivered Successfully",
  `
Hello ${order.username},

🎉 Great news! Your FoodRush order has been delivered successfully.

━━━━━━━━━━━━━━━━━━
🧾 Order Details
━━━━━━━━━━━━━━━━━━

📦 Order ID: ${order.orderId}
💰 Total Amount: ₹${order.totalPrice}

We hope you enjoy your meal and had a great delivery experience with FoodRush 🍔

Thank you for choosing FoodRush for your cravings.

We look forward to serving you again soon 🚀

Enjoy your food and have a wonderful day!

— Team FoodRush
`
);

    res.json({
      message: "Order delivered and mail sent",
      order,
    });
  } catch (err) {
    console.error("Delivered mail error:", err);
    res.status(500).json({ message: "Failed to mark delivered" });
  }
});

router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

module.exports = router;
