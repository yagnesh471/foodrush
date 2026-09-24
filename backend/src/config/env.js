import dotenv from "dotenv";

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  },
  orderTimeline: {
    preparingAfterSeconds: Number(process.env.ORDER_PREPARING_AFTER_SECONDS) || 15,
    outForDeliveryAfterSeconds: Number(process.env.ORDER_OUT_FOR_DELIVERY_AFTER_SECONDS) || 35,
    deliveredAfterSeconds: Number(process.env.ORDER_DELIVERED_AFTER_SECONDS) || 60,
  },
};
