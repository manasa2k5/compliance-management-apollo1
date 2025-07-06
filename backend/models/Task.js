const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ["Government", "Internal", "External"], // update as needed
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "overdue"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  file: {
  type: String, // store filename or full URL
},

});

module.exports = mongoose.model("Task", TaskSchema);
