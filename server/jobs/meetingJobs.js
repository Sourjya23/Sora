const cron = require('node-cron');
const Meeting = require('../models/Meeting');

const init = () => {
  // Safe Maintenance Job: Runs weekly to archive stale abandoned sessions (> 180 days past scheduled date)
  // Preserves all active, upcoming, and past interviews even after 2-3+ months of no logins.
  cron.schedule('0 3 * * 0', async () => {
    try {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const staleMeetings = await Meeting.updateMany(
        { status: 'scheduled', scheduledTime: { $lt: sixMonthsAgo } },
        { $set: { status: 'dismissed' } }
      );

      if (staleMeetings.modifiedCount > 0) {
        console.log(`⏰ Cleaned up ${staleMeetings.modifiedCount} archived meetings older than 180 days.`);
      }
    } catch (error) {
      console.error('Error in Meeting Maintenance job:', error);
    }
  });
};

module.exports = { init };
