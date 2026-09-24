import mongoose from "mongoose";

const { Schema, model } = mongoose;

const addressSchema = new Schema({
  type: {
    type: String,
    enum: ["Home", "Work", "Other"],
    default: "Home",
  },
  fullAddress: {
    type: String,
    required: true,
    trim: true,
  },
  landmark: {
    type: String,
    trim: true,
    default: "",
  },
  city: {
    type: String,
    trim: true,
    default: "",
  },
  pincode: {
    type: String,
    trim: true,
    default: "",
  },
  latitude: Number,
  longitude: Number,
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpires: Date,
    addresses: [addressSchema],
    favorites: [{ type: Schema.Types.ObjectId, ref: "Food" }],
  },
  { timestamps: true }
);

// Never leak password / otp fields when a user document is serialized.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.otp;
    delete ret.otpExpires;
    return ret;
  },
});

export const User = model("User", userSchema);
