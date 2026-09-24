import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    foodId: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// Prevent multiple reviews on the same food from the same user
reviewSchema.index({ foodId: 1, userId: 1 }, { unique: true });

export const Review = model("Review", reviewSchema);

