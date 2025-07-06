const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOverdueEmail = async (to, taskTitle, dueDate) => {
  try {
    await transporter.sendMail({
      from: `"Apollo Compliance System" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🔔 Overdue Task Reminder",
      html: `
        <p>Hello,</p>
        <p>This is a gentle reminder that the task <strong>"${taskTitle}"</strong> is overdue.</p>
        <p>Due Date: <strong>${new Date(dueDate).toLocaleDateString("en-IN")}</strong></p>
        <p>Please take the necessary action.</p>
        <br />
        <p>Regards,<br>Apollo Compliance System</p>
      `
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
};

module.exports = sendOverdueEmail;
