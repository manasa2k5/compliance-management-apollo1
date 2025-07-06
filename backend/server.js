const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const path = require("path");
const auditLogRoutes = require("./routes/auditLogRoutes");
const sendOverdueEmails = require("./utils/sendOverdueEmails");
const auditRoutes = require("./routes/auditRoutes");

require("dotenv").config(); // ✅ Make sure this is at the top

console.log("Mongo URI:", process.env.MONGODB_URI); // ✅ Debug log

const app = express();

// Middleware
app.use(cors());
app.use(cors({
  origin: "http://localhost:3000", // your frontend URL
  credentials: true
}));
app.use(express.json());
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/auditlogs", auditRoutes);

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

app.use("/api/auth", require("./routes/authRoutes"));
// Handle multer file size error
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Max size is 2MB." });
  }
  if (err.message && err.message.includes("Only")) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully.");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });


 const cron = require("node-cron");

cron.schedule("0 8 * * *", () => {
  console.log("⏰ Sending overdue task emails at 8AM IST...");
  sendOverdueEmails();
}, {
  timezone: "Asia/Kolkata"
});


