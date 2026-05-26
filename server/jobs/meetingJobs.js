
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
        console.log(`⏰ Auto-expired ${expiredMeetings.length} stale meeting links.`);
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
        console.log(`🧹 Cleaned up videos for ${oldMeetings.length} old meetings.`);
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
        console.log(`⏰ Auto-dismissed ${missed.modifiedCount} missed meetings.`);
      }
    } catch (error) {
      console.error('Error in Missed Meetings job:', error);
    }
  });
};

module.exports = { init };
