require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./models/User");
const { sendEmail } = require("./utils/emailService");

async function sendRemindersNow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Fetch all unverified users
    const unverifiedUsers = await User.find({
      $or: [
        { profileCompleted: false },
        { profileStatus: 'pending' },
        { isVerified: false }
      ]
    });

    console.log(`Found ${unverifiedUsers.length} unverified users. Preparing to send emails...`);

    let sentCount = 0;
    for (const user of unverifiedUsers) {
      if (user.email) {
        console.log(`Sending email to ${user.email}...`);
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
  <li><strong>Scope of Improvisation:</strong> Improving Time complexities, space complexities along with communication skills and representation skills.</li>
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
        
        const AdminNotification = require('./models/AdminNotification');
        await AdminNotification.create({
          type: "email_sent",
          message: `Profile verification reminder sent to ${user.email}`,
          userId: user._id
        });
        
        sentCount++;
      }
    }
    console.log(`Successfully sent ${sentCount} reminder emails!`);
  } catch(e) {
    console.error("Error sending emails:", e);
  } finally {
    mongoose.connection.close();
  }
}
sendRemindersNow();
