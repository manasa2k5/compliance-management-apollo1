const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const sendOverdueEmail = require("../utils/sendEmail");
const multer = require("multer");
const path = require("path");
const logAudit = require("../utils/logAudit");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const AuditLog = require("../models/AuditLog");


// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|png|jpg|jpeg/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, JPG, PNG files are allowed!"));
    }
  },
});

// @desc    Get all tasks
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "dept_admin") {
      query.department = req.user.department;
    } else if (req.user.role === "executive") {
      query.assignedTo = req.user._id;
    }
    // Super Admin → no filter

    const tasks = await Task.find(query).populate("assignedTo").sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
});

// @desc    Create a new task
router.post(
  "/",
  protect,
  authorizeRoles("super_admin", "dept_admin"), // ⬅️ Only these 2 roles can create
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        department,
        category,
        dueDate,
        assignedTo,
        createdBy, // frontend should send this
      } = req.body;

      const newTask = new Task({
        title,
        description,
        department,
        category,
        dueDate,
        assignedTo,
        file: req.file ? req.file.filename : null,
      });

      await newTask.save();

      // ✅ Log action
      await logAudit({
        action: "Create Task",
        performedBy: createdBy || req.user?.name || "Unknown",
        details: `Task "${title}" created for ${department} department`,
      });

      res.status(201).json({ message: "Task created successfully", task: newTask });
    } catch (error) {
      console.error("❌ Error creating task:", error.message);
      res.status(500).json({ message: "Error creating task", error: error.message });
    }
  }
);


// DELETE /api/tasks/:id


router.delete("/:id", protect, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // ✅ Log audit
 await logAudit({
  action: "Delete Task",
  performedBy: req.body.updatedBy || req.user?.id || "Unknown",
  details: `Task "${task.title}" deleted from ${task.department} department`,
});

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});


   



// Manual test route for escalation logic
router.get("/test-escalation", async (req, res) => {
  const now = new Date();

  try {
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: "pending"
    }).populate("reportingManager");

    for (const task of overdueTasks) {
      task.status = "overdue";
      await task.save();

      if (task.reportingManager?.email) {
        await sendEmail({
          to: task.reportingManager.email,
          subject: `🚨 Task Overdue: ${task.title}`,
          text: `The task "${task.title}" was due on ${task.dueDate.toDateString()} and is now marked as overdue.`
        });
      }
    }

    res.json({
      message: `Escalation checked. ${overdueTasks.length} overdue tasks processed.`
    });
  } catch (err) {
    console.error("Escalation test failed:", err);
    res.status(500).json({ error: "Escalation test failed" });
  }
});

// GET overdue tasks
router.get("/overdue", async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const overdueTasks = await Task.find({
      status: "pending",
      dueDate: { $lt: new Date(today) },
    }).populate("assignedTo");
    res.json(overdueTasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching overdue tasks" });
  }
});

// ✅ Send email notifications for overdue tasks
router.get("/send-overdue-notifications", async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);

    // Fetch tasks that are pending and overdue
    const overdueTasks = await Task.find({
      status: "pending",
      dueDate: { $lt: new Date(today) },
    }).populate("assignedTo");

    // Send email to each assigned user
    for (let task of overdueTasks) {
      if (task.assignedTo && task.assignedTo.email) {
        await sendOverdueEmail(task.assignedTo.email, task.title, task.dueDate);
      }
    }

    res.json({ message: "Overdue notifications sent", count: overdueTasks.length });
  } catch (err) {
    console.error("❌ Error sending overdue notifications:", err.message);
    res.status(500).json({ message: "Error sending notifications", error: err.message });
  }
});


router.put("/:id/status", protect, authorizeRoles("super_admin", "dept_admin"), async (req, res) => {
  try {
    const { status, updatedBy } = req.body;

    if (!status || !updatedBy) {
      return res.status(400).json({ message: "Status and updatedBy are required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = status;
    await task.save();


     const log = new AuditLog({
      action: "Task Status Updated",
      performedBy: req.user._id,
      details: `Marked task "${task.title}" as ${req.body.status}`,
    });
    await log.save();

    // Optionally log in audit
    res.json({ message: "Task status updated", task });
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    res.status(500).json({ message: "Failed to update task status" });
  }
});







module.exports = router;



