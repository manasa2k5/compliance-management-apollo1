const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 👈 this is critical to support .populate()
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String,
    required: true,
  },
});

// ✅ Prevent OverwriteModelError during hot reload or repeated imports
module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
