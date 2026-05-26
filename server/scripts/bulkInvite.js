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
      background-color: #f3f4f6;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      padding: 40px 20px;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      padding: 48px 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 36px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -1.5px;
      margin: 0;
    }
    .logo span {
      color: #3b82f6; /* Vibrant Blue Accent */
    }
    .subtitle {
      margin: 12px 0 0 0;
      font-size: 16px;
      color: #6b7280;
      font-weight: 500;
      letter-spacing: -0.2px;
    }
    .content {
      padding: 0 40px 40px;
      line-height: 1.6;
    }
    h2 {
      color: #111827;
      font-size: 22px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    p {
      color: #4b5563;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .instructions-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .instructions-box h3 {
      color: #111827;
      font-size: 16px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      color: #4b5563;
      font-size: 14px;
    }
    li {
      margin-bottom: 10px;
    }
    .cta-container {
      text-align: center;
      margin-top: 48px;
    }
    .btn-primary {
      display: inline-block;
      background-color: #111827;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 8px;
      margin-bottom: 16px;
      transition: background-color 0.2s;
    }
    .feedback-section {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .feedback-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .btn-secondary {
      display: inline-block;
      background-color: #ffffff;
      color: #374151 !important;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      padding: 12px 24px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
    }
    .footer {
      text-align: center;
      padding: 32px 20px;
      font-size: 13px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">Sora<span>.</span></h1>
        <p class="subtitle">Master your craft, one interview at a time.</p>
      </div>
      
      <div class="content">
        <h2>You're invited to early access</h2>
        <p>I've been building a next-generation technical interview and adaptive practice platform. I would love for you to test it out and share your honest feedback.</p>
        
        <div class="instructions-box">
          <h3>🧑‍💻 For Candidates</h3>
          <ul>
            <li>Create an account to access the Candidate Dashboard.</li>
            <li>Explore the AI-driven <strong>Adaptive Practice</strong> modules.</li>
            <li>Request a live Technical Interview from the community.</li>
          </ul>
        </div>

        <div class="instructions-box">
          <h3>👔 For Interviewers</h3>
          <ul>
            <li>Sign in as an Interviewer to view pending <strong>Interview Tickets</strong>.</li>
            <li>Accept a candidate's ticket to review their profile.</li>
            <li>Launch the collaborative, real-time coding lobby.</li>
          </ul>
        </div>

        <div class="cta-container">
          <a href="${DEPLOYED_URL}" class="btn-primary">Explore Sora Now</a>
        </div>

        <div class="feedback-section">
          <p class="feedback-text">Once you've had a chance to explore the platform, I'd greatly appreciate a quick review!</p>
          <a href="${FEEDBACK_URL}" class="btn-secondary">Leave a Testimonial</a>
        </div>
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
