const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✔️ Present" : "❌ MISSING");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // send to yourself
  subject: "✅ Test Email",
  text: "This is a test from nodemailer",
})
.then(() => console.log("✅ Email sent!"))
.catch(err => console.error("❌ Error:", err.message));
