const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail"); // We'll create this in Step 3

// Run every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
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
          text: `The task titled "${task.title}" was due on ${task.dueDate.toDateString()} and is now marked as overdue. Please take necessary action.`
        });
      }
    }

    console.log(`[Escalation] Processed ${overdueTasks.length} overdue tasks.`);
  } catch (err) {
    console.error("Error in escalation job:", err);
  }
});
