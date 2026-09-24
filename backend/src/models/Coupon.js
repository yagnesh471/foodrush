import mongoose from "mongoose";

const { Schema, model } = mongoose;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountAmount: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Coupon = model("Coupon", couponSchema);

