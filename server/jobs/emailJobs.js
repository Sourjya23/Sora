
const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

const init = () => {
  // 1. Upcoming Interview Reminders: Daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

      const upcomingMeetings = await Meeting.find({
        status: 'scheduled',
        scheduledTime: { $gte: tomorrowStart, $lt: tomorrowEnd }
      }).populate('candidateId interviewerId');

      for (const meeting of upcomingMeetings) {
        if (meeting.candidateId?.email) {
          await sendEmail({
            to: meeting.candidateId.email,
            subject: 'Reminder: Upcoming Technical Interview on Sora',
            html: `<p>Hello ${meeting.candidateId.name},</p><p>You have an interview scheduled for ${meeting.scheduledTime.toLocaleString()}.</p><p>Meeting ID: ${meeting.meetingId}</p><p>Key Password: ${meeting.keyPassword}</p>`
          });
        }
        if (meeting.interviewerId?.email) {
          await sendEmail({
            to: meeting.interviewerId.email,
            subject: 'Reminder: Upcoming Technical Evaluation on Sora',
            html: `<p>Hello ${meeting.interviewerId.name},</p><p>You are scheduled to conduct an interview at ${meeting.scheduledTime.toLocaleString()}.</p><p>Meeting ID: ${meeting.meetingId}</p><p>Key Password: ${meeting.keyPassword}</p>`
          });
        }
      }
      if (upcomingMeetings.length > 0) {
        console.log(`📧 Sent reminders for ${upcomingMeetings.length} upcoming meetings.`);
      }
    } catch (error) {
      console.error('Error in Email Reminder job:', error);
    }
  });

  // 2. Admin Reminders for Pending Profiles: Weekly on Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    try {
      const pendingCount = await User.countDocuments({ profileStatus: 'pending' });
      if (pendingCount > 0) {
        // We'll hardcode an admin email or use the one provided by user
        await sendEmail({
          to: 'teamsora23@gmail.com', // Admin email
          subject: 'Action Required: Pending Profiles on Sora',
          html: `<p>Hello Admin,</p><p>There are currently ${pendingCount} candidate profiles waiting for verification on the platform.</p>`
        });
        console.log(`📧 Sent admin digest for ${pendingCount} pending profiles.`);
      }
    } catch (error) {
      console.error('Error in Admin Digest job:', error);
    }
  });
};

module.exports = { init };
