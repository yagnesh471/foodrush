import { verifyToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";

const extractBearerToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

// Verifies the JWT and attaches the *actual* authenticated user to
// req.user. Previously, order/address endpoints trusted a plain
// `username` field sent in the request body — anyone could place an
// order or read another user's addresses just by naming them. Every
// user-scoped route now goes through this middleware instead.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw new ApiError(401, "Authentication required");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired session. Please log in again.");
  }

  if (payload.role !== "user") throw new ApiError(403, "User access only");

  const user = await User.findById(payload.userId);
  if (!user) throw new ApiError(401, "Account no longer exists");

  req.user = user;
  next();
});

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw new ApiError(401, "Admin login required");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Admin session expired. Please log in again.");
  }

  if (payload.role !== "admin") throw new ApiError(403, "Admin access only");

  next();
});
