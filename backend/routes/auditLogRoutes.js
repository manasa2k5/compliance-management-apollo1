const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");

// ✅ Get all audit logs
router.get("/", async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100); // latest first
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching audit logs", error: err.message });
  }
});

module.exports = router;
