import { Order } from "../models/Order.js";
import { Food } from "../models/Food.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOrderId } from "../utils/generators.js";
import { sendOrderConfirmationEmail, sendOrderCancelledEmail } from "../services/emailService.js";
import {
  syncOrderStatus,
  syncOrderStatuses,
  secondsUntilDelivered,
} from "../services/orderTrackingService.js";
import { env } from "../config/env.js";

const GST_RATE = 0.05;
const DELIVERY_FEE = 40;

const serializeOrder = (order) => ({
  ...order.toObject(),
  etaSeconds: ["Delivered", "Cancelled"].includes(order.status)
    ? 0
    : secondsUntilDelivered(order.createdAt),
});

// The order body only needs the cart + which saved address to use +
// payment method — subtotal/GST/total are recomputed here rather than
// trusted from the client, and the address is resolved from the user's
// own saved addresses (or a one-off address object) instead of reading
// out of localStorage on the frontend.
export const createOrder = asyncHandler(async (req, res) => {
  const { items, addressId, address: rawAddress, paymentMethod, latitude, longitude } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  let address = rawAddress;
  if (addressId) {
    const savedAddress = req.user.addresses.id(addressId);
    if (!savedAddress) throw new ApiError(404, "Selected address was not found");
    address = savedAddress.toObject();
  }

  if (!address?.fullAddress) {
    throw new ApiError(400, "Please provide a delivery address");
  }

  const foodIds = items.map(item => item.foodId);
  const foods = await Food.find({ _id: { $in: foodIds } });
  
  const foodMap = new Map();
  foods.forEach(f => foodMap.set(f._id.toString(), f));

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const dbFood = foodMap.get(item.foodId);
    if (!dbFood) throw new ApiError(400, `Food item not found: ${item.name || item.foodId}`);
    
    subtotal += dbFood.price * Number(item.quantity);
    validatedItems.push({
      foodId: dbFood._id,
      name: dbFood.name,
      price: dbFood.price,
      quantity: Number(item.quantity)
    });
  }

  const gst = Math.round(subtotal * GST_RATE);
  let totalPrice = subtotal + gst + DELIVERY_FEE;
  
  let discountAmount = 0;
  let appliedPromo = null;

  if (req.body.promoCode) {
    const { Coupon } = await import("../models/Coupon.js");
    const coupon = await Coupon.findOne({ code: req.body.promoCode.toUpperCase(), isActive: true });
    
    if (!coupon) {
      throw new ApiError(400, "Invalid or expired promo code");
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new ApiError(400, "Promo code usage limit reached");
    }
    
    discountAmount = coupon.discountAmount;
    if (discountAmount > totalPrice) discountAmount = totalPrice; // Prevent negative totals
    
    totalPrice -= discountAmount;
    appliedPromo = coupon;
  }

  const order = await Order.create({
    orderId: generateOrderId(),
    user: req.user._id,
    username: req.user.username,
    email: req.user.email,
    phone: req.user.phone,
    address,
    items: validatedItems,
    subtotal,
    gst,
    deliveryFee: DELIVERY_FEE,
    promoCode: appliedPromo ? appliedPromo.code : undefined,
    discountAmount,
    specialInstructions: req.body.specialInstructions || "",
    totalPrice,
    paymentMethod: paymentMethod || "cod",
    paymentStatus: paymentMethod === "cod" ? "COD" : "Paid",
    latitude,
    longitude,
  });

  if (appliedPromo) {
    appliedPromo.usedCount += 1;
    await appliedPromo.save();
  }

  await sendOrderConfirmationEmail(order);

  res.status(201).json(serializeOrder(order));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  const synced = await syncOrderStatuses(orders);
  res.json(synced.map(serializeOrder));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");

  if (!order.user.equals(req.user._id)) {
    throw new ApiError(403, "You do not have access to this order");
  }

  const synced = await syncOrderStatus(order);
  res.json(serializeOrder(synced));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");

  if (!order.user.equals(req.user._id)) {
    throw new ApiError(403, "You do not have access to this order");
  }

  await syncOrderStatus(order);

  if (["Out for Delivery", "Delivered", "Cancelled"].includes(order.status)) {
    throw new ApiError(400, "Order cannot be cancelled now");
  }

  order.status = "Cancelled";
  order.autoProgress = false;
  order.cancelledAt = new Date();
  await order.save();

  await sendOrderCancelledEmail(order);

  res.json(serializeOrder(order));
});

export const getOrderTimelineConfig = asyncHandler(async (_req, res) => {
  res.json(env.orderTimeline);
});

export const validatePromo = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new ApiError(400, "Promo code is required");
  
  const { Coupon } = await import("../models/Coupon.js");
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  
  if (!coupon) {
    throw new ApiError(400, "Invalid or expired promo code");
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(400, "Promo code usage limit reached");
  }
  
  res.json({ success: true, discountAmount: coupon.discountAmount, code: coupon.code });
});
