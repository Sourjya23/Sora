const cron = require("node-cron");
const Meeting = require("../models/Meeting");

// Safely maintain old database records without prematurely deleting meeting history
cron.schedule("0 2 1 * *", async () => {
  try {
    // Only remove dismissed meetings older than 1 year (365 days)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const result = await Meeting.deleteMany({
      status: "dismissed",
      createdAt: {
        $lt: oneYearAgo,
      },
    });

    console.log(`[cron] Archived ${result.deletedCount || 0} discarded meetings older than 1 year.`);
  } catch (err) {
    console.error("[cron] Error cleaning archived meetings:", err);
  }
});
