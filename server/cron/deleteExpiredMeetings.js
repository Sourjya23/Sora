const cron = require("node-cron");
const Meeting = require("../models/Meeting");

cron.schedule("0 0 * * *", async () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  await Meeting.deleteMany({
    createdAt: {
      $lt: threeDaysAgo,
    },
  });

  console.log("Expired meetings deleted");
});
