const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");

router.get("/", async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 }) // or `createdAt` if you prefer
      .populate("performedBy", "name email"); // ✅ shows name and email

    res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching audit logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
});

module.exports = router;
