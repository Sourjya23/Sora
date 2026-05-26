
const cron = require('node-cron');
const InterviewTicket = require('../models/InterviewTicket');

const init = () => {
  // Stale Ticket Auto-Dismissal: Daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const stale = await InterviewTicket.updateMany(
        { status: 'pending', createdAt: { $lt: sevenDaysAgo } },
        { $set: { status: 'dismissed' } }
      );
      if (stale.modifiedCount > 0) {
        console.log(`🎫 Auto-dismissed ${stale.modifiedCount} stale interview tickets.`);
      }
    } catch (error) {
      console.error('Error in Stale Ticket job:', error);
    }
  });
};

module.exports = { init };
