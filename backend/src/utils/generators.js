import crypto from "node:crypto";

export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

export const generateOrderId = () => `ORD${Date.now()}${crypto.randomInt(100, 999)}`;
