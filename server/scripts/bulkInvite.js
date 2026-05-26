const path = require('path');
const dotenv = require('dotenv');
// Load environment variables (from the root server directory)
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendEmail } = require('../utils/emailService');

// --------------------------------------------------------------------------
// 1. CONFIGURE YOUR EMAIL RECIPIENTS HERE
// Add the 10 emails you want to invite in this array.
// --------------------------------------------------------------------------
const RECIPIENTS = [
  'teamsora23@gmail.com',
  // 'friend1@example.com',
  // 'friend2@example.com',
];

const DEPLOYED_URL = 'https://sorabuild.netlify.app';
const FEEDBACK_URL = `${DEPLOYED_URL}/feedback`;

// --------------------------------------------------------------------------
// 2. THEMED HTML EMAIL TEMPLATE
// --------------------------------------------------------------------------
const getEmailHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #000000;
      border: 1px solid #27272a;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 40px;
      margin-bottom: 40px;
    }
    .header {
      background: linear-gradient(180deg, #18181b 0%, #000000 100%);
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid #27272a;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      margin: 0;
    }
    .logo span {
      color: #d2dbbd; /* Sage Green */
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    h2 {
      color: #ffffff;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      color: #a1a1aa;
      font-size: 15px;
      margin-bottom: 24px;
    }
    .instructions-box {
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .instructions-box h3 {
      color: #d2dbbd;
      font-size: 16px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      color: #a1a1aa;
      font-size: 14px;
    }
    li {
      margin-bottom: 8px;
    }
    .cta-container {
      text-align: center;
      margin-top: 40px;
      margin-bottom: 40px;
    }
    .btn-primary {
      display: inline-block;
      background-color: #d2dbbd;
      color: #09090b;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 50px;
      margin-bottom: 16px;
    }
    .btn-secondary {
      display: inline-block;
      background-color: transparent;
      color: #d2dbbd;
      font-weight: 500;
      font-size: 14px;
      text-decoration: none;
      padding: 12px 24px;
      border: 1px solid #d2dbbd;
      border-radius: 50px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      border-top: 1px solid #27272a;
      font-size: 12px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Sora<span>.</span></h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; color: #a1a1aa;">Master your craft, one interview at a time.</p>
    </div>
    
    <div class="content">
      <h2>You're invited to try Sora!</h2>
      <p>I've been building a next-generation technical interview and adaptive practice platform, and I would love for you to try it out and let me know what you think.</p>
      
      <div class="instructions-box">
        <h3>🧑‍💻 How to try it as a Candidate</h3>
        <ul>
          <li>Go to the site and click "Sign Up" to create a Candidate account.</li>
          <li>Navigate to your Dashboard and check out the AI-driven <strong>Adaptive Practice</strong>.</li>
          <li>Request a live Technical Interview from the community.</li>
        </ul>
      </div>

      <div class="instructions-box">
        <h3>👔 How to try it as an Interviewer</h3>
        <ul>
          <li>Create an Interviewer account (or sign in with one).</li>
          <li>Visit your Dashboard to view pending <strong>Interview Tickets</strong>.</li>
          <li>Accept a ticket, view the candidate's resume, and launch the collaborative coding lobby.</li>
        </ul>
      </div>

      <div class="cta-container">
        <a href="${DEPLOYED_URL}" class="btn-primary">Try Sora Now</a>
        <br>
        <p style="margin-top: 24px; margin-bottom: 16px; font-size: 14px;">Once you've had a chance to explore, I'd greatly appreciate a quick review!</p>
        <a href="${FEEDBACK_URL}" class="btn-secondary">Leave a Testimonial</a>
      </div>
    </div>

    <div class="footer">
      This is an automated invitation sent via Sora.<br>
      © 2026 Sora Interview Platform
    </div>
  </div>
</body>
</html>
`;

// --------------------------------------------------------------------------
// 3. EXECUTION SCRIPT
// --------------------------------------------------------------------------
const runBulkInvite = async () => {
  console.log(`🚀 Preparing to send ${RECIPIENTS.length} custom invitations...`);
  
  if (RECIPIENTS.length === 0) {
    console.log('❌ No recipients found. Please add emails to the RECIPIENTS array.');
    process.exit(1);
  }

  let successCount = 0;
  const htmlContent = getEmailHTML();

  for (const email of RECIPIENTS) {
    try {
      console.log(`📨 Sending invite to ${email}...`);
      await sendEmail({
        to: email,
        subject: 'You\'re Invited to Try Sora!',
        html: htmlContent
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send to ${email}:`, error.message);
    }
  }

  console.log(`\n✅ Finished! Successfully sent ${successCount}/${RECIPIENTS.length} invitations.`);
  process.exit(0);
};

runBulkInvite();
