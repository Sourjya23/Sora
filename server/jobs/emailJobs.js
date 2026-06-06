
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
  // 3. Profile Verification Reminder: Every 30 minutes
  // Targets users who registered between 30 and 60 minutes ago, ensuring they only get the email once.
  cron.schedule('*/30 * * * *', async () => {
    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);

      const unverifiedUsers = await User.find({
        profileCompleted: false,
        createdAt: { $gte: sixtyMinsAgo, $lt: thirtyMinsAgo }
      });

      for (const user of unverifiedUsers) {
        if (user.email) {
          await sendEmail({
            to: user.email,
            subject: 'Action Required: Complete your Sora.ai Profile Verification',
            html: `
<p>Hi ${user.name || 'User'},</p>
<p>Welcome to Sora.ai! We noticed that your profile verification is still pending.</p>
<h3>Why verify your profile?</h3>
<p>Verifying your profile is essential to unlock the true power of Sora.ai. Once verified, you get immediate access to:</p>
<ul>
  <li><strong>The Full Interview Flow:</strong> Test out our real-time, peer-to-peer collaborative coding environment before your actual interviews!</li>
  <li><strong>AI Forensic Practice:</strong> Generate adaptive coding challenges and get AI-graded Big-O evaluations.</li>
  <li><strong>Visibility to Recruiters:</strong> Top companies can seamlessly find your complete portfolio and skills.</li>
</ul>
<p>Please navigate to your dashboard and ensure the following fields are fully filled out:</p>
<ul>
  <li><strong>National ID</strong></li>
  <li><strong>Resume URL</strong></li>
  <li><strong>Skills</strong></li>
  <li><strong>Intro / Bio</strong></li>
  <li><strong>Experience Level</strong></li>
  <li><strong>Projects (Title, Link, Description)</strong></li>
</ul>
<p>Click the button below to log in and get verified:</p>
<br/>
<a href="https://sorabuild.netlify.app" style="display:inline-block; padding:10px 20px; background-color:#10b981; color:#ffffff; text-decoration:none; border-radius:5px; font-weight:bold;">Go to Dashboard</a>
<br/><br/>
<p>Best regards,<br/>The Sora.ai Team</p>
            `
          });
        }
      }
      
      if (unverifiedUsers.length > 0) {
        console.log(`📧 Sent profile verification reminders to ${unverifiedUsers.length} users.`);
      }
    } catch (error) {
      console.error('Error in Profile Verification Reminder job:', error);
    }
  });
};

module.exports = { init };
