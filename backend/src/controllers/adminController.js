import { Food } from "../models/Food.js";
import { User } from "../models/User.js";
import { Order, ORDER_STATUSES } from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAdminToken } from "../utils/token.js";
import { env } from "../config/env.js";
import { sendOrderDeliveredEmail, sendOrderCancelledEmail, sendOrderStatusEmail } from "../services/emailService.js";
import { syncOrderStatuses } from "../services/orderTrackingService.js";

export const adminLogin = asyncHandler(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (username !== env.admin.username || password !== env.admin.password) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  res.json({ message: "Admin login successful", token: signAdminToken() });
});

export const getStats = asyncHandler(async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalUsers, 
    totalOrders, 
    totalFoods, 
    revenueAgg, 
    statusAgg, 
    todaysOrders,
    popularFoodsAgg,
    dailyAgg
  ] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Food.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", qty: { $sum: "$items.quantity" } } },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ]),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ])
  ]);

  let deliveredOrders = 0;
  let cancelledOrders = 0;
  const ordersByStatus = {};
  
  statusAgg.forEach(s => {
    ordersByStatus[s._id] = s.count;
    if (s._id === "Delivered") deliveredOrders = s.count;
    if (s._id === "Cancelled") cancelledOrders = s.count;
  });

  res.json({
    totalUsers,
    totalFoods,
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    todaysOrders,
    ordersByStatus,
    popularFoods: popularFoodsAgg.map(p => ({ name: p._id, quantity: p.qty })),
    dailyStats: dailyAgg.reverse().map(d => ({ date: d._id, orders: d.orders, revenue: d.revenue }))
  });
});

export const listAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  const synced = await syncOrderStatuses(orders);
  res.json(synced);
});

export const createFood = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const category = String(req.body.category || "").trim();
  const price = Number(req.body.price);
  const image_url = String(req.body.image_url || "").trim();

  if (!name || !category || !image_url || !Number.isFinite(price) || price <= 0) {
    throw new ApiError(400, "Please provide a valid name, category, price and image URL");
  }

  const food = await Food.create({ name, category, price, image_url });
  res.status(201).json(food);
});

export const updateFood = asyncHandler(async (req, res) => {
  const { name, category, price, image_url, available } = req.body;
  const food = await Food.findById(req.params.id);
  if (!food) throw new ApiError(404, "Food item not found");

  if (name !== undefined) food.name = String(name).trim();
  if (category !== undefined) food.category = String(category).trim();
  if (price !== undefined) food.price = Number(price);
  if (image_url !== undefined) food.image_url = String(image_url).trim();
  if (available !== undefined) food.available = Boolean(available);

  if (food.price <= 0 || !Number.isFinite(food.price)) {
    throw new ApiError(400, "Price must be a valid positive number");
  }

  await food.save();
  res.json(food);
});

export const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) throw new ApiError(404, "Food item not found");
  res.json({ message: "Food deleted" });
});

const sendStatusEmail = async (order) => {
  if (order.status === "Delivered") return sendOrderDeliveredEmail(order);
  if (order.status === "Cancelled") return sendOrderCancelledEmail(order);
  return sendOrderStatusEmail(order);
};

import { getIo } from "../socket.js";

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!ORDER_STATUSES.includes(req.body.status)) {
    throw new ApiError(400, "Invalid status");
  }

  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");

  order.status = req.body.status;
  // A human decision always wins over the automatic clock from here on.
  order.autoProgress = false;
  if (req.body.status === "Delivered") order.deliveredAt = new Date();
  await order.save();

  await sendStatusEmail(order);
  
  // Real-time update
  try {
    const io = getIo();
    io.to(order.orderId).emit("order_updated", order);
  } catch (err) {
    console.error("Socket error", err);
  }

  res.json(order);
});

export const getCoupons = asyncHandler(async (_req, res) => {
  const { Coupon } = await import("../models/Coupon.js");
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { Coupon } = await import("../models/Coupon.js");
  const { code, discountAmount, maxUses } = req.body;
  
  if (!code || !discountAmount) {
    throw new ApiError(400, "Promo code and discount amount are required");
  }
  
  try {
    const coupon = await Coupon.create({ 
      code: String(code).toUpperCase().trim(), 
      discountAmount: Number(discountAmount), 
      maxUses: Number(maxUses) || 0 
    });
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) throw new ApiError(400, "Promo code already exists");
    throw err;
  }
});
