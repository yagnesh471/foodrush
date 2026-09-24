import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });
};
