import mongoose from "mongoose";

const { Schema, model } = mongoose;

const orderItemSchema = new Schema(
  {
    foodId: { type: Schema.Types.ObjectId, ref: "Food" },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// Snapshot of the address at order time — the order should keep its own
// copy even if the user later edits/deletes that saved address.
const orderAddressSchema = new Schema(
  {
    type: { type: String, default: "Home" },
    fullAddress: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

export const ORDER_STATUSES = [
  "Order Placed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, trim: true },
    email: String,
    phone: String,
    address: orderAddressSchema,
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    gst: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 40 },
    promoCode: { type: String, trim: true },
    discountAmount: { type: Number, default: 0 },
    specialInstructions: { type: String, trim: true, default: "" },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "COD"], default: "Pending" },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Order Placed",
    },
    // When true, the order's status auto-advances on a server-side clock
    // (see services/orderTrackingService.js) purely from `createdAt`, so the
    // customer's browser being open has no bearing on delivery state. Once
    // an admin manually sets a status, auto-progression stops for that order.
    autoProgress: { type: Boolean, default: true },
    deliveredAt: Date,
    cancelledAt: Date,
    notifications: {
      deliveredEmailSent: { type: Boolean, default: false },
    },
    latitude: Number,
    longitude: Number,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order = model("Order", orderSchema);
