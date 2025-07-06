// backend/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Set storage destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // this folder should exist
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// Init upload middleware
const upload = multer({ storage });

// POST route to upload a file
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ message: "File uploaded successfully", fileUrl });
});

module.exports = router;
