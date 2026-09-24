import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // Needed on platforms (Render, Railway, etc.) that sit behind a proxy,
  // so express-rate-limit reads the real client IP instead of the proxy's.
  app.set("trust proxy", 1);

  app.use(
    cors()
  );

  app.use(express.json());

  app.use("/api", apiRoutes);

  app.get("/", (_req, res) => {
    res.json({ success: true, message: "FoodRush backend running 🚀" });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
