const cron = require('node-cron');
const InterviewTicket = require('../models/InterviewTicket');

const init = () => {
  // Safe Ticket Maintenance: Runs weekly on Sunday
  // Preserves pending interview tickets for at least 180 days (6 months)
  // so candidates and interviewers can maintain their interview flow even after months of inactivity.
  cron.schedule('0 3 * * 0', async () => {
    try {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const stale = await InterviewTicket.updateMany(
        { status: 'pending', createdAt: { $lt: sixMonthsAgo } },
        { $set: { status: 'dismissed' } }
      );
      if (stale.modifiedCount > 0) {
        console.log(`🎫 Auto-dismissed ${stale.modifiedCount} abandoned interview tickets older than 180 days.`);
      }
    } catch (error) {
      console.error('Error in Stale Ticket job:', error);
    }
  });
};

module.exports = { init };
