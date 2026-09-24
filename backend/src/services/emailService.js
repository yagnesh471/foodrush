import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
});

transporter
  .verify()
  .then(() => console.log("✅ SMTP connected"))
  .catch((err) => console.warn("⚠️ SMTP connection failed:", err.message));

const wrapHtml = (text) => `
  <div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:30px;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:12px;overflow:hidden;">
      <div style="background:#ff6b35;padding:20px;text-align:center;color:white;">
        <h1>🍔 FoodRush</h1>
        <p>Delicious food, delivered fast 🚀</p>
      </div>
      <div style="padding:30px;color:#333;line-height:1.7;">
        ${text.replace(/\n/g, "<br>")}
      </div>
      <div style="background:#fafafa;padding:15px;text-align:center;color:#777;font-size:14px;">
        © 2026 FoodRush
      </div>
    </div>
  </div>
`;

// Sending mail must never crash the request that triggered it (e.g. an
// order placement shouldn't fail just because SMTP is briefly down), so
// failures are logged and swallowed here — the one place that decision
// is made, instead of being repeated around every call site.
export async function sendEmail(to, subject, text) {
  if (!to) return;

  try {
    const info = await transporter.sendMail({
      from: `"FoodRush 🍔" <${env.smtp.from}>`,
      to,
      subject,
      text,
      html: wrapHtml(text),
    });
    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.warn("⚠️ Email send failed:", err.message);
  }
}

export const sendSignupOtpEmail = (user, otp) =>
  sendEmail(
    user.email,
    "Welcome to the FoodRush Family! 🍔 Here's your secret key...",
    `Hello ${user.username},

We are absolutely thrilled to welcome you to FoodRush! 🎉

To get you started on your delicious journey, we just need to quickly verify your email address. 

Here is your one-time verification code:
🔐 OTP: ${otp}

This code will keep its magic for the next 10 minutes. Please keep it safe and don't share it with anyone!

We can't wait to serve you,
— Your friends at FoodRush`
  );

export const sendWelcomeEmail = (user) =>
  sendEmail(
    user.email,
    "You're all set! 🎊 Let's get ordering!",
    `Hello ${user.username},

Woohoo! Your FoodRush account has been verified and is ready to go! 🎉

You're now part of a community that loves great food, delivered fast. Feel free to browse our mouth-watering menu, save your favorite dishes, and track your orders in real-time.

What are you waiting for? Let's get something delicious delivered straight to your door!

Stay hungry, stay happy,
— Your friends at FoodRush`
  );

export const sendPasswordResetLinkEmail = (user, token) => {
  const resetLink = `http://localhost:5173/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
  return sendEmail(
    user.email,
    "Need to unlock your account? 🔑 We've got you covered!",
    `Hello ${user.username},

It happens to the best of us! We received a request to reset the password for your FoodRush account.

Don't worry, you're just one click away from getting back to your favorite meals. 

🔗 Click the link below to securely reset your password:
${resetLink}

This link is valid for 10 minutes. If you didn't request this, simply ignore this email and your account will remain perfectly secure.

Always here to help,
— Your friends at FoodRush`
  );
};

export const sendPasswordChangedEmail = (user) =>
  sendEmail(
    user.email,
    "Success! Your password is as good as new 🔐",
    `Hello ${user.username},

Just a quick heads-up that your FoodRush account password has been successfully updated! ✅

You can now use your new password the next time you log in to satisfy your cravings.

If you did NOT make this change, please reach out to our support team immediately so we can help secure your account.

Stay secure,
— Your friends at FoodRush`
  );

export const sendAccountDeletedEmail = (user) =>
  sendEmail(
    user.email,
    "We'll miss you! 🥺 Your account has been deleted",
    `Hello ${user.username},

We've successfully processed your request and your FoodRush account has now been completely deleted. 

We are genuinely sorry to see you go! We hope you enjoyed the meals we delivered to you. 

Remember, our kitchen doors are always open. If you ever change your mind and want to come back, you know where to find us!

Wishing you all the best,
— Your friends at FoodRush`
  );

export const sendOrderConfirmationEmail = (order) =>
  sendEmail(
    order.email,
    "We've got your order! 🍔 The kitchen is firing up!",
    `Hello ${order.username},

Amazing choice! 🎉 Thank you for ordering with FoodRush. We've received your order and the kitchen is already preparing it with love.

Here are the details of your feast:
📦 Order ID: ${order.orderId}
💳 Payment Method: ${String(order.paymentMethod).toUpperCase()}
💰 Total Amount: ₹${order.totalPrice}

Sit back and relax! You can track your meal live directly from the FoodRush tracking page. 

Get your plate ready,
— Your friends at FoodRush`
  );

export const sendOrderCancelledEmail = (order) =>
  sendEmail(
    order.email,
    "Order Cancelled ❌ But we're still here for your cravings!",
    `Hello ${order.username},

We just wanted to confirm that your FoodRush order (${order.orderId}) has been successfully cancelled. 

We're sorry it didn't work out this time, but don't worry! Whenever hunger strikes again, we'll be right here waiting with a menu full of delicious options.

Hope to serve you soon,
— Your friends at FoodRush`
  );

export const sendOrderDeliveredEmail = (order) =>
  sendEmail(
    order.email,
    "Food's here! 🍔 Time to dig in!",
    `Hello ${order.username},

The wait is over! 🎉 Your FoodRush order (${order.orderId}) has been successfully delivered right to your door.

Total Amount Paid: ₹${order.totalPrice}

We poured our hearts into this meal, and we hope you absolutely love it. Enjoy every single bite!

Bon appétit,
— Your friends at FoodRush`
  );

export const sendOrderStatusEmail = (order) =>
  sendEmail(
    order.email,
    "Order Update: Things are moving! 🚀",
    `Hi ${order.username},

Just a quick update on your FoodRush order (${order.orderId})! 

Your order status has just been updated to: ${order.status}!

We're working hard to get your food to you as quickly and freshly as possible. You can check the live tracking page for real-time updates.

Almost time to eat,
— Your friends at FoodRush`
  );
