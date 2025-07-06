// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const sendOverdueNotifications = require("../utils/sendOverdueEmails");



router.post("/trigger-overdue-emails", async (req, res) => {
  try {
    await sendOverdueNotifications();
    res.status(200).json({ message: "📨 Overdue emails triggered manually." });
  } catch (error) {
    console.error("❌ Error sending overdue emails:", error);
    res.status(500).json({ message: "Failed to send overdue emails", error: error.message });
  }
});

module.exports = router;
