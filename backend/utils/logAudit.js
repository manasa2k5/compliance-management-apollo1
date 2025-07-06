const AuditLog = require("../models/AuditLog");

/**
 * Logs an audit action to the database
 * @param {Object} params - action details
 * @param {String} params.action - The type of action (e.g., "Create Task")
 * @param {String} params.performedBy - The user ID who performed the action
 * @param {String} [params.details] - Any extra detail about the action
 */

const logAudit = async ({ action, performedBy, details }) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      details,
      timestamp: new Date()
    });
  } catch (err) {
    console.error("❌ Failed to log audit:", err.message);
  }
};

module.exports = logAudit;


