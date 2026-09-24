import { ApiError } from "../utils/ApiError.js";

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

// Single place that turns any thrown error (ApiError, Mongoose
// validation error, or unexpected bug) into a consistent JSON shape.
// The old routes each hand-rolled their own res.status(...).json(...)
// error branch, duplicated ~20 times.
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err?.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ success: false, message: `That ${field} is already in use` });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
};
