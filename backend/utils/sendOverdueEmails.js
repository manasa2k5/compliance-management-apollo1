const Task = require("../models/Task");
const User = require("../models/User");
const nodemailer = require("nodemailer");

require("dotenv").config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
 // ✅ Add this at the top if not present

const sendOverdueEmails = async () => {
  const today = new Date().setHours(0, 0, 0, 0);

  const overdueTasks = await Task.find({
    status: "pending",
    dueDate: { $lt: new Date(today) },
  }).populate("assignedTo");

  for (const task of overdueTasks) {
    if (!task.assignedTo?.email) continue;

    const mailOptions = {
 from: `"Apollo Compliance System" <${process.env.EMAIL_USER}>`,

  to: task.assignedTo.email,
  subject: `⚠️ Overdue Task: ${task.title}`,
 html: `
  <p>Hello ${task.assignedTo.name || ""},</p>
  <p>This is a gentle reminder that the task <strong>"${task.title}"</strong> is overdue.</p>
  <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString("en-GB")}</p>
  <p>Please take the necessary action.</p>
  <br/>
  <p>Regards,<br/>Apollo Compliance System</p>
`

};


    try {
      console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✔️ Present" : "❌ Missing");

      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${task.assignedTo.email}`);
    } catch (error) {
      console.error("❌ Failed to send email:", error.message);
    }
  }

  return { message: "Overdue notifications sent", count: overdueTasks.length };
};

module.exports = sendOverdueEmails;
