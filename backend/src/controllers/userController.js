import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");
  res.json(user.favorites || []);
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const user = await User.findById(req.user._id);
  
  if (!user.favorites) user.favorites = [];
  
  const index = user.favorites.indexOf(foodId);
  if (index === -1) {
    user.favorites.push(foodId);
  } else {
    user.favorites.splice(index, 1);
  }
  
  await user.save();
  res.json({ favorites: user.favorites });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, phone } = req.body;
  const user = await User.findById(req.user._id);
  
  if (username) user.username = username;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  
  await user.save();
  
  // Exclude password and otp before returning
  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.otp;
  delete updatedUser.otpExpires;
  
  res.json(updatedUser);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Please provide old and new password");
  }
  
  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");
  
  const bcrypt = await import("bcryptjs");
  const passwordMatches = await bcrypt.compare(oldPassword, user.password);
  if (!passwordMatches) throw new ApiError(401, "Incorrect old password");
  
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }
  
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  
  res.json({ message: "Password updated successfully" });
});

import { sendAccountDeletedEmail } from "../services/emailService.js";

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");
  
  await sendAccountDeletedEmail(user);
  await User.deleteOne({ _id: user._id });
  
  res.json({ message: "Account deleted successfully" });
});

