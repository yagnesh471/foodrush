import mongoose from "mongoose";

const { Schema, model } = mongoose;

const foodSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    image_url: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Food = model("Food", foodSchema);
