
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
