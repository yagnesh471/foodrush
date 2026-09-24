import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signUserToken = (user) =>
  jwt.sign({ userId: user._id.toString(), username: user.username, role: "user" }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const signAdminToken = () =>
  jwt.sign({ role: "admin" }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
