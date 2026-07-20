const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
});

transporter.verify()
  .then(() => {
    console.log("✅ Brevo SMTP Connected Successfully");
  })
  .catch((err) => {
    console.log("❌ BREVO SMTP ERROR:");
    console.log(err.message);
  });

async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: `"FoodRush 🍔" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,

      html: `
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
      `,
    });

    console.log("✅ Email sent:", info.messageId);

  } catch (err) {

    console.log("❌ EMAIL SEND ERROR:");
    console.log(err.message);

  }
}

module.exports = { sendEmail };
