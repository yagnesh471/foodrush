const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    email: String,
    phone: String,
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    gst: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 40 },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "COD"], default: "Pending" },
    status: {
      type: String,
      enum: ["Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Order Placed",
    },
    latitude: Number,
    longitude: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
