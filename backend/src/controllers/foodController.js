import mongoose from "mongoose";
import { Food } from "../models/Food.js";
import { Review } from "../models/Review.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listFoods = asyncHandler(async (req, res) => {
  const { category, sort } = req.query;
  
  let query = { available: true };
  if (category && category !== "All") {
    query.category = category;
  }
  
  let sortObj = { createdAt: -1 }; // default
  if (sort === "price_asc") sortObj = { price: 1 };
  if (sort === "price_desc") sortObj = { price: -1 };
  if (sort === "rating_desc") sortObj = { averageRating: -1 };
  if (sort === "newest") sortObj = { createdAt: -1 };

  const foods = await Food.find(query).sort(sortObj);
  res.json(foods);
});

export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const foodId = req.params.id;
  const userId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Ensure user has ordered and received this item
  const hasOrdered = await Order.exists({
    user: userId,
    status: "Delivered",
    "items.foodId": foodId
  });

  if (!hasOrdered) {
    throw new ApiError(403, "You can only review items you have successfully ordered and received.");
  }

  // Create review
  try {
    await Review.create({
      foodId,
      userId,
      username: req.user.username,
      rating,
      comment
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(400, "You have already reviewed this item.");
    }
    throw err;
  }

  // Update average rating on Food
  const stats = await Review.aggregate([
    { $match: { foodId: new mongoose.Types.ObjectId(foodId) } },
    { $group: { _id: "$foodId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  if (stats.length > 0) {
    await Food.findByIdAndUpdate(foodId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count
    });
  }

  res.status(201).json({ message: "Review added successfully!" });
});

export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ foodId: req.params.id }).sort({ createdAt: -1 });
  res.json(reviews);
});
