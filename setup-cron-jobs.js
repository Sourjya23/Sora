const fs = require('fs');
const path = require('path');

const jobsDir = path.join(__dirname, 'server/jobs');
if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });

const indexJs = `
const meetingJobs = require('./meetingJobs');
const emailJobs = require('./emailJobs');
const ticketJobs = require('./ticketJobs');

const startCronJobs = () => {
  console.log('⏳ Initializing background cron jobs...');
  meetingJobs.init();
  emailJobs.init();
  ticketJobs.init();
  console.log('✅ Cron jobs initialized.');
};

module.exports = { startCronJobs };
`;

const meetingJobsJs = `
const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const { deleteFromCloudinary } = require('../config/cloudinary');

const init = () => {
  // 1. Link Expiration: Every 5 minutes, expire meetings that have been in 'scheduled' state
  // for > 10 minutes past their creation.
  cron.schedule('*/5 * * * *', async () => {
    try {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const expiredMeetings = await Meeting.find({
        status: 'scheduled',
        createdAt: { $lt: tenMinsAgo }
      });

      if (expiredMeetings.length > 0) {
        for (const meeting of expiredMeetings) {
          meeting.status = 'dismissed';
          await meeting.save();
        }
        console.log(\`⏰ Auto-expired \${expiredMeetings.length} stale meeting links.\`);
      }
    } catch (error) {
      console.error('Error in Meeting Expiration job:', error);
    }
  });

  // 2. Storage Cleanup: Every hour, find completed meetings updated > 2 hours ago.
  // Delete the video from Cloudinary and nullify the DB field.
  cron.schedule('0 * * * *', async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const oldMeetings = await Meeting.find({
        status: 'completed',
        updatedAt: { $lt: twoHoursAgo },
        recordingUrl: { $ne: null }
      });

      if (oldMeetings.length > 0) {
        for (const meeting of oldMeetings) {
          if (meeting.recordingUrl) {
            await deleteFromCloudinary(meeting.recordingUrl);
            meeting.recordingUrl = null;
          }
          await meeting.save();
        }
        console.log(\`🧹 Cleaned up videos for \${oldMeetings.length} old meetings.\`);
      }
    } catch (error) {
      console.error('Error in Storage Cleanup job:', error);
    }
  });
  
  // 3. Missed Meetings Fallback: Find meetings where scheduledTime was > 2 hours ago but status is still scheduled.
  cron.schedule('0 * * * *', async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const missed = await Meeting.updateMany(
        { status: 'scheduled', scheduledTime: { $lt: twoHoursAgo } },
        { $set: { status: 'dismissed' } }
      );
      if (missed.modifiedCount > 0) {
        console.log(\`⏰ Auto-dismissed \${missed.modifiedCount} missed meetings.\`);
      }
    } catch (error) {
      console.error('Error in Missed Meetings job:', error);
    }
  });
};

module.exports = { init };
`;

const emailJobsJs = `
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
            html: \`<p>Hello \${meeting.candidateId.name},</p><p>You have an interview scheduled for \${meeting.scheduledTime.toLocaleString()}.</p><p>Meeting ID: \${meeting.meetingId}</p><p>Key Password: \${meeting.keyPassword}</p>\`
          });
        }
        if (meeting.interviewerId?.email) {
          await sendEmail({
            to: meeting.interviewerId.email,
            subject: 'Reminder: Upcoming Technical Evaluation on Sora',
            html: \`<p>Hello \${meeting.interviewerId.name},</p><p>You are scheduled to conduct an interview at \${meeting.scheduledTime.toLocaleString()}.</p><p>Meeting ID: \${meeting.meetingId}</p><p>Key Password: \${meeting.keyPassword}</p>\`
          });
        }
      }
      if (upcomingMeetings.length > 0) {
        console.log(\`📧 Sent reminders for \${upcomingMeetings.length} upcoming meetings.\`);
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
          html: \`<p>Hello Admin,</p><p>There are currently \${pendingCount} candidate profiles waiting for verification on the platform.</p>\`
        });
        console.log(\`📧 Sent admin digest for \${pendingCount} pending profiles.\`);
      }
    } catch (error) {
      console.error('Error in Admin Digest job:', error);
    }
  });
};

module.exports = { init };
`;

const ticketJobsJs = `
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
        console.log(\`🎫 Auto-dismissed \${stale.modifiedCount} stale interview tickets.\`);
      }
    } catch (error) {
      console.error('Error in Stale Ticket job:', error);
    }
  });
};

module.exports = { init };
`;

fs.writeFileSync(path.join(jobsDir, 'index.js'), indexJs);
fs.writeFileSync(path.join(jobsDir, 'meetingJobs.js'), meetingJobsJs);
fs.writeFileSync(path.join(jobsDir, 'emailJobs.js'), emailJobsJs);
fs.writeFileSync(path.join(jobsDir, 'ticketJobs.js'), ticketJobsJs);
