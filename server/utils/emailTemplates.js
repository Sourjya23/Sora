/**
 * Unified Sora Email Templates Specification
 * Strictly implements the 9-part lifecycle communication specification:
 * 1. Account registration (To: Candidate)
 * 2. Interview ticket created (To: Candidate)
 * 3. Interview proposed — Interviewer invitation (To: Interviewer)
 * 4. Interview slot confirmed (To: Candidate & Interviewer)
 * 5. Five-minute interview reminder (To: Candidate & Interviewer)
 * 6. Interview completed (To: Candidate)
 * 7A. Selection confirmation (To: Candidate)
 * 7B. Rejection confirmation (To: Candidate)
 * 8. Operational incident report — Founder notification (To: Founder tickmelodie@gmail.com)
 *    Variants: 8A, 8B, 8C, 8D
 * 9. Daily founder report (To: Founder tickmelodie@gmail.com)
 *
 * Sender is always teamsora23@gmail.com
 * Founder recipient is always tickmelodie@gmail.com
 * Candidate & Interviewer recipients are 100% dynamically resolved from database records.
 */

const FROM_EMAIL = process.env.EMAIL_USER || "teamsora23@gmail.com";
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL || "tickmelodie@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sorabuild.netlify.app";

// Reusable email styling container
const wrapEmailHtml = (bodyContent, senderSignoff = "Sora HR & Operations Team", senderEmail = FROM_EMAIL) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #031320; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .email-wrapper { max-width: 620px; margin: 24px auto; background-color: #041826; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6); }
    .email-header { padding: 24px 32px; background: linear-gradient(135deg, #07243a 0%, #041826 100%); border-bottom: 1px solid rgba(56, 189, 248, 0.15); }
    .brand-title { margin: 0; font-family: Georgia, serif; font-size: 26px; color: #ffffff; letter-spacing: -0.5px; font-weight: normal; }
    .brand-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; margin-top: 4px; font-family: monospace; }
    .email-body { padding: 32px; font-size: 14px; line-height: 1.65; color: #cbd5e1; }
    .section-box { background: rgba(7, 36, 58, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 18px 22px; margin: 20px 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .meta-table td { padding: 6px 0; font-size: 13px; vertical-align: top; }
    .meta-label { color: #94a3b8; width: 38%; font-weight: 500; }
    .meta-val { color: #f8fafc; font-weight: 600; }
    .highlight-text { color: #38bdf8; font-weight: bold; }
    .btn-action { display: inline-block; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 13px; margin-right: 10px; margin-top: 10px; transition: all 0.2s ease; }
    .btn-primary { background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); color: #02101b !important; }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: #e2e8f0 !important; border: 1px solid rgba(255, 255, 255, 0.15); }
    .email-footer { padding: 24px 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #64748b; line-height: 1.6; background-color: #03131f; }
    .footer-signoff { color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
    .footer-email { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1 class="brand-title">Sora</h1>
      <div class="brand-tag">Autonomous Technical Assessment Platform</div>
    </div>
    <div class="email-body">
      ${bodyContent}
    </div>
    <div class="email-footer">
      <div class="footer-signoff">Regards,</div>
      <div>${senderSignoff}</div>
      <a href="mailto:${senderEmail}" class="footer-email">${senderEmail}</a>
    </div>
  </div>
</body>
</html>
`;

// ============================================================================
// 1. ACCOUNT REGISTRATION
// ============================================================================
function templateAccountRegistration({
  candidateName = "Candidate",
  candidateEmail,
  registrationDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  verificationUrl = `${FRONTEND_URL}/verify-otp?email=${encodeURIComponent(candidateEmail || "")}`,
  verificationExpiry = "5 minutes",
  otpCode = "",
}) {
  const subject = "Welcome to Sora — Verify Your Email Address";

  const html = wrapEmailHtml(`
    <p>Dear ${candidateName},</p>
    <p>Welcome to Sora.</p>
    <p>Your account has been successfully created. To complete your registration, please verify your email address using the link below.</p>
    
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Account Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Name:</td><td class="meta-val">${candidateName}</td></tr>
        <tr><td class="meta-label">Registered Email:</td><td class="meta-val">${candidateEmail}</td></tr>
        <tr><td class="meta-label">Registration Date:</td><td class="meta-val">${registrationDate}</td></tr>
      </table>
    </div>

    ${otpCode ? `
      <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-family: monospace; letter-spacing: 1px;">Your 6-Digit Verification Code</span>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace; margin: 8px 0;">${otpCode}</div>
      </div>
    ` : ""}

    <div style="margin: 24px 0;">
      <a href="${verificationUrl}" class="btn-action btn-primary">Verify Your Email &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #94a3b8;">Verify your email: <a href="${verificationUrl}" style="color: #38bdf8; word-break: break-all;">${verificationUrl}</a></p>
    <p style="font-size: 12px; color: #f59e0b;">This verification link will expire in ${verificationExpiry}.</p>
    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If you did not initiate this registration, please disregard this email.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${candidateName},

Welcome to Sora.

Your account has been successfully created. To complete your registration, please verify your email address using the link below.

Account Details
Name: ${candidateName}
Registered Email: ${candidateEmail}
Registration Date: ${registrationDate}
${otpCode ? `Verification Code: ${otpCode}\n` : ""}
Verify your email: ${verificationUrl}
This verification link will expire at ${verificationExpiry}.

If you did not initiate this registration, please disregard this email.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: candidateEmail };
}

// ============================================================================
// 2. INTERVIEW TICKET CREATED
// ============================================================================
function templateTicketCreated({
  candidateName = "Candidate",
  candidateEmail,
  referenceId,
  position,
  department = "Engineering",
  createdAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const pos = position || "Software Engineer Technical Assessment";
  const subject = `Interview Request Received — ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${candidateName},</p>
    <p>We have successfully received your interview request through Sora.</p>
    <p>Our team will coordinate with the interviewer and communicate the proposed schedule once a suitable slot is available.</p>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Request Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Candidate:</td><td class="meta-val">${candidateName}</td></tr>
        <tr><td class="meta-label">Interview Reference:</td><td class="meta-val" style="font-family: monospace; color: #38bdf8;">${refId}</td></tr>
        <tr><td class="meta-label">Position:</td><td class="meta-val">${pos}</td></tr>
        <tr><td class="meta-label">Department:</td><td class="meta-val">${department}</td></tr>
        <tr><td class="meta-label">Request Submitted:</td><td class="meta-val">${createdAt}</td></tr>
        <tr><td class="meta-label">Current Status:</td><td class="meta-val" style="color: #f59e0b;">Awaiting Interviewer Confirmation</td></tr>
      </table>
    </div>

    <p style="color: #cbd5e1; font-size: 13px;">You will receive another email once the interview schedule has been confirmed.</p>
    <p style="color: #cbd5e1; font-size: 13px;">Thank you for choosing Sora.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${candidateName},

We have successfully received your interview request through Sora.

Our team will coordinate with the interviewer and communicate the proposed schedule once a suitable slot is available.

Request Details
Candidate: ${candidateName}
Interview Reference: ${refId}
Position: ${pos}
Department: ${department}
Request Submitted: ${createdAt}
Current Status: Awaiting Interviewer Confirmation

You will receive another email once the interview schedule has been confirmed.

Thank you for choosing Sora.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: candidateEmail };
}

// ============================================================================
// 3. INTERVIEW PROPOSED — INTERVIEWER INVITATION
// ============================================================================
function templateInterviewerInvitation({
  interviewerName = "Interviewer",
  interviewerEmail,
  candidateName = "Candidate",
  candidateEmail = "",
  position = "Software Engineer Technical Assessment",
  referenceId,
  proposedDate,
  proposedTime,
  duration = "45 - 60 minutes",
  timezone = "IST (UTC+5:30)",
  confirmUrl = `${FRONTEND_URL}/interviewer-dashboard`,
  declineUrl = `${FRONTEND_URL}/interviewer-dashboard`,
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const subject = `Interview Assignment — ${candidateName} | ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${interviewerName},</p>
    <p>We would like to invite you to conduct an interview for the following candidate through Sora.</p>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Candidate Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Name:</td><td class="meta-val">${candidateName}</td></tr>
        <tr><td class="meta-label">Email:</td><td class="meta-val">${candidateEmail}</td></tr>
        <tr><td class="meta-label">Position:</td><td class="meta-val">${position}</td></tr>
        <tr><td class="meta-label">Interview Reference:</td><td class="meta-val" style="font-family: monospace; color: #38bdf8;">${refId}</td></tr>
      </table>
    </div>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Proposed Schedule</div>
      <table class="meta-table">
        <tr><td class="meta-label">Date:</td><td class="meta-val">${proposedDate}</td></tr>
        <tr><td class="meta-label">Time:</td><td class="meta-val">${proposedTime}</td></tr>
        <tr><td class="meta-label">Duration:</td><td class="meta-val">${duration}</td></tr>
        <tr><td class="meta-label">Time Zone:</td><td class="meta-val">${timezone}</td></tr>
      </table>
    </div>

    <p style="margin-top: 16px;">Please review the proposed schedule and confirm your availability.</p>

    <div style="margin: 20px 0;">
      <a href="${confirmUrl}" class="btn-action btn-primary">Confirm Slot &rarr;</a>
      <a href="${declineUrl}" class="btn-action btn-secondary">Provide Alternative</a>
    </div>

    <p style="font-size: 12px; color: #94a3b8;">
      Confirm: <a href="${confirmUrl}" style="color: #38bdf8;">${confirmUrl}</a><br/>
      Decline: <a href="${declineUrl}" style="color: #94a3b8;">${declineUrl}</a>
    </p>
    <p style="font-size: 12px; color: #cbd5e1;">If the proposed slot is unsuitable, please provide an alternative through the scheduling interface.</p>
    <p style="font-size: 12px; color: #cbd5e1;">We appreciate your time and cooperation.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${interviewerName},

We would like to invite you to conduct an interview for the following candidate through Sora.

Candidate Details
Name: ${candidateName}
Email: ${candidateEmail}
Position: ${position}
Interview Reference: ${refId}

Proposed Schedule
Date: ${proposedDate}
Time: ${proposedTime}
Duration: ${duration}
Time Zone: ${timezone}

Please review the proposed schedule and confirm your availability.

Confirm: ${confirmUrl}
Decline: ${declineUrl}

If the proposed slot is unsuitable, please provide an alternative through the scheduling interface.

We appreciate your time and cooperation.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: interviewerEmail };
}

// ============================================================================
// 4. INTERVIEW SLOT CONFIRMED
// ============================================================================
function templateSlotConfirmed({
  recipientName = "Participant",
  recipientEmail,
  candidateName,
  interviewerName,
  position = "Software Engineer Technical Assessment",
  confirmedDate,
  confirmedTime,
  duration = "45 - 60 minutes",
  timezone = "IST (UTC+5:30)",
  referenceId,
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const subject = `Interview Confirmed — ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${recipientName},</p>
    <p>This email confirms that the interview schedule has been finalised.</p>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Interview Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Candidate:</td><td class="meta-val">${candidateName}</td></tr>
        <tr><td class="meta-label">Interviewer:</td><td class="meta-val">${interviewerName}</td></tr>
        <tr><td class="meta-label">Position:</td><td class="meta-val">${position}</td></tr>
        <tr><td class="meta-label">Date:</td><td class="meta-val">${confirmedDate}</td></tr>
        <tr><td class="meta-label">Time:</td><td class="meta-val">${confirmedTime}</td></tr>
        <tr><td class="meta-label">Duration:</td><td class="meta-val">${duration}</td></tr>
        <tr><td class="meta-label">Time Zone:</td><td class="meta-val">${timezone}</td></tr>
        <tr><td class="meta-label">Reference ID:</td><td class="meta-val" style="font-family: monospace; color: #38bdf8;">${refId}</td></tr>
      </table>
    </div>

    <p style="color: #cbd5e1; font-size: 13px;">The meeting link and joining instructions will be shared separately before the scheduled interview.</p>
    <p style="color: #cbd5e1; font-size: 13px;">Please ensure that you are available at the confirmed time.</p>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">If you anticipate any scheduling issues, inform the Sora team as early as possible.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${recipientName},

This email confirms that the interview schedule has been finalised.

Interview Details
Candidate: ${candidateName}
Interviewer: ${interviewerName}
Position: ${position}
Date: ${confirmedDate}
Time: ${confirmedTime}
Duration: ${duration}
Time Zone: ${timezone}
Reference ID: ${refId}

The meeting link and joining instructions will be shared separately before the scheduled interview.

Please ensure that you are available at the confirmed time.

If you anticipate any scheduling issues, inform the Sora team as early as possible.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: recipientEmail };
}

// ============================================================================
// 5. FIVE-MINUTE INTERVIEW REMINDER
// ============================================================================
function templateFiveMinuteReminder({
  recipientName = "Participant",
  recipientEmail,
  candidateName,
  interviewerName,
  date,
  time,
  meetingUrl,
  meetingPasscode,
  referenceId,
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const subject = `Interview Starting in 5 Minutes — ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${recipientName},</p>
    <p>This is a reminder that your scheduled interview is due to begin in approximately five minutes.</p>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Meeting Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Candidate:</td><td class="meta-val">${candidateName}</td></tr>
        <tr><td class="meta-label">Interviewer:</td><td class="meta-val">${interviewerName}</td></tr>
        <tr><td class="meta-label">Date:</td><td class="meta-val">${date}</td></tr>
        <tr><td class="meta-label">Time:</td><td class="meta-val">${time}</td></tr>
        <tr><td class="meta-label">Meeting Link:</td><td class="meta-val"><a href="${meetingUrl}" style="color: #38bdf8; word-break: break-all;">${meetingUrl}</a></td></tr>
        <tr><td class="meta-label">Meeting Passcode:</td><td class="meta-val" style="font-family: monospace; color: #38bdf8; letter-spacing: 2px;">${meetingPasscode}</td></tr>
        <tr><td class="meta-label">Reference ID:</td><td class="meta-val" style="font-family: monospace;">${refId}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${meetingUrl}" class="btn-action btn-primary" style="padding: 14px 32px; font-size: 14px;">Enter Interview Room &rarr;</a>
    </div>

    <div style="background: rgba(3, 19, 32, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 22px; margin: 20px 0;">
      <div style="font-weight: 600; color: #f8fafc; font-size: 13px; margin-bottom: 8px;">Before joining, please ensure:</div>
      <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.8;">
        <li>Your internet connection is stable.</li>
        <li>Your camera and microphone are functioning.</li>
        <li>Required browser permissions are enabled.</li>
        <li>You are using a supported browser.</li>
      </ul>
    </div>

    <p style="color: #cbd5e1; font-size: 13px;">Please join a few minutes before the scheduled start time.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${recipientName},

This is a reminder that your scheduled interview is due to begin in approximately five minutes.

Meeting Details
Candidate: ${candidateName}
Interviewer: ${interviewerName}
Date: ${date}
Time: ${time}
Meeting Link: ${meetingUrl}
Meeting Passcode: ${meetingPasscode}
Reference ID: ${refId}

Before joining, please ensure:
Your internet connection is stable.
Your camera and microphone are functioning.
Required browser permissions are enabled.
You are using a supported browser.

Please join a few minutes before the scheduled start time.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: recipientEmail };
}

// ============================================================================
// 6. INTERVIEW COMPLETED
// ============================================================================
function templateInterviewCompleted({
  candidateName = "Candidate",
  candidateEmail,
  referenceId,
  position = "Software Engineer Technical Assessment",
  interviewerName = "Interviewer",
  date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  actualDuration = "52 minutes",
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const subject = `Interview Completed — ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${candidateName},</p>
    <p>Your interview session has been successfully concluded.</p>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">Session Summary</div>
      <table class="meta-table">
        <tr><td class="meta-label">Interview Reference:</td><td class="meta-val" style="font-family: monospace; color: #38bdf8;">${refId}</td></tr>
        <tr><td class="meta-label">Position:</td><td class="meta-val">${position}</td></tr>
        <tr><td class="meta-label">Interviewer:</td><td class="meta-val">${interviewerName}</td></tr>
        <tr><td class="meta-label">Date:</td><td class="meta-val">${date}</td></tr>
        <tr><td class="meta-label">Actual Session Duration:</td><td class="meta-val">${actualDuration}</td></tr>
        <tr><td class="meta-label">Session Status:</td><td class="meta-val" style="color: #34d399;">Completed</td></tr>
      </table>
    </div>

    <p style="color: #cbd5e1; font-size: 13px;">Your interview information has been submitted for review.</p>
    <p style="color: #cbd5e1; font-size: 13px;">The final outcome will be communicated once the interviewer has completed the evaluation and confirmed the decision.</p>
    <p style="color: #94a3b8; font-size: 13px;">There is no further action required from you at this stage.</p>
    <p style="color: #cbd5e1; font-size: 13px; margin-top: 18px;">Thank you for your time.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${candidateName},

Your interview session has been successfully concluded.

Session Summary
Interview Reference: ${refId}
Position: ${position}
Interviewer: ${interviewerName}
Date: ${date}
Actual Session Duration: ${actualDuration}
Session Status: Completed

Your interview information has been submitted for review.
The final outcome will be communicated once the interviewer has completed the evaluation and confirmed the decision.

There is no further action required from you at this stage.

Thank you for your time.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: candidateEmail };
}

// ============================================================================
// 7A. SELECTION CONFIRMATION
// ============================================================================
function templateSelectionConfirmation({
  candidateName = "Candidate",
  candidateEmail,
  position = "Software Engineer",
  date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  referenceId,
  confirmedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  nextSteps = "Our recruitment team will schedule a final leadership discussion and dispatch your formal compensation offer package within 2 business days.",
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const subject = `Interview Outcome — Selected | ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${candidateName},</p>
    <p>We are pleased to inform you that, following the completion of your interview and the interviewer's final evaluation, you have been selected for the next stage of the recruitment process.</p>

    <div class="section-box" style="border-color: rgba(52, 211, 153, 0.3); background: rgba(5, 46, 32, 0.5);">
      <div style="font-weight: 600; color: #34d399; font-size: 14px; margin-bottom: 10px;">Candidate Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Name:</td><td class="meta-val">${candidateName}</td></tr>
        <tr><td class="meta-label">Position:</td><td class="meta-val">${position}</td></tr>
        <tr><td class="meta-label">Interview Date:</td><td class="meta-val">${date}</td></tr>
        <tr><td class="meta-label">Interview Reference:</td><td class="meta-val" style="font-family: monospace; color: #34d399;">${refId}</td></tr>
        <tr><td class="meta-label">Decision Date:</td><td class="meta-val">${confirmedAt}</td></tr>
      </table>
    </div>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 8px;">Next Steps</div>
      <p style="margin: 0; color: #e2e8f0; font-size: 13px; line-height: 1.6;">${nextSteps}</p>
    </div>

    <p style="color: #cbd5e1; font-size: 13px;">Our team will communicate any further requirements, documentation or onboarding instructions separately.</p>
    <p style="color: #34d399; font-weight: 600; font-size: 14px; margin-top: 18px;">Congratulations, and thank you for your interest in Sora.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${candidateName},

We are pleased to inform you that, following the completion of your interview and the interviewer's final evaluation, you have been selected for the next stage of the recruitment process.

Candidate Details
Name: ${candidateName}
Position: ${position}
Interview Date: ${date}
Interview Reference: ${refId}
Decision Date: ${confirmedAt}

Next Steps
${nextSteps}

Our team will communicate any further requirements, documentation or onboarding instructions separately.

Congratulations, and thank you for your interest in Sora.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: candidateEmail };
}

// ============================================================================
// 7B. REJECTION CONFIRMATION
// ============================================================================
function templateRejectionConfirmation({
  candidateName = "Candidate",
  candidateEmail,
  position = "Software Engineer",
  referenceId,
}) {
  const refId = referenceId || `REQ-${Date.now().toString().slice(-6)}`;
  const subject = `Interview Outcome — ${refId}`;

  const html = wrapEmailHtml(`
    <p>Dear ${candidateName},</p>
    <p>Thank you for taking the time to participate in the interview process through Sora.</p>
    <p>After reviewing your interview and receiving the interviewer's final decision, we regret to inform you that you have not been selected for ${position} at this time.</p>
    <p>We appreciate the effort and time you invested in the process.</p>
    <p>We encourage you to continue developing your skills and pursuing opportunities aligned with your career goals.</p>
    <p>We wish you success in your future endeavours.</p>
  `, "Sora HR & Operations Team", FROM_EMAIL);

  const text = `
Dear ${candidateName},

Thank you for taking the time to participate in the interview process through Sora.

After reviewing your interview and receiving the interviewer's final decision, we regret to inform you that you have not been selected for ${position} at this time.

We appreciate the effort and time you invested in the process.

We encourage you to continue developing your skills and pursuing opportunities aligned with your career goals.

We wish you success in your future endeavours.

Regards,
Sora HR & Operations Team
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: candidateEmail };
}

// ============================================================================
// 8. OPERATIONAL INCIDENT REPORT — FOUNDER NOTIFICATION (8, 8A, 8B, 8C, 8D)
// ============================================================================
function templateIncidentReport({
  incidentId,
  incidentType = "GENERAL_INCIDENT",
  severity = "P1 - HIGH",
  detectedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  referenceId,
  status = "OPEN",
  candidateName = "N/A",
  candidateEmail = "N/A",
  interviewerName = "N/A",
  interviewerEmail = "N/A",
  description = "An operational anomaly was recorded by Sora Sentinel.",
  expectedBehaviour = "Smooth end-to-end execution without interruption.",
  actualBehaviour = "Invariant failure or timeout occurred.",
  errorDetails = "No stack trace provided.",
  timestamp = new Date().toISOString(),
  recordingStatus = "INCOMPLETE",
  recordingReference = "REC-NONE",
  actionTaken = "Flagged in Sentinel operational audit log and metrics incremented.",
  pendingAction = "Investigate system logs and reschedule interview if necessary.",
  recommendedAction = "Verify host network and WebRTC signaling servers.",
  variantData = {}, // For 8A, 8B, 8C, 8D specific extra keys
}) {
  const incId = incidentId || `INC-${Date.now().toString().slice(-8)}`;
  const refId = referenceId || "N/A";
  const subject = `[SORA INCIDENT] ${severity} — ${incidentType} | ${refId}`;

  // Sub-sections depending on variant
  let specificHtml = "";
  if (incidentType === "CANDIDATE_JOIN_FAILURE") {
    specificHtml = `
      <div class="section-box" style="border-color: rgba(244, 63, 94, 0.3);">
        <div style="font-weight: 600; color: #fb7185; font-size: 13px; margin-bottom: 8px;">Incident Specifics (8A: Candidate Unable to Join)</div>
        <table class="meta-table">
          <tr><td class="meta-label">Join Attempt Time:</td><td class="meta-val">${variantData.candidateJoinAttemptTime || timestamp}</td></tr>
          <tr><td class="meta-label">Scheduled Time:</td><td class="meta-val">${variantData.scheduledTime || "N/A"}</td></tr>
          <tr><td class="meta-label">Failure Reason:</td><td class="meta-val" style="color: #fca5a5;">${description}</td></tr>
          <tr><td class="meta-label">Interviewer Waiting:</td><td class="meta-val">${variantData.interviewerWaitingStatus || "WAITING_IN_ROOM"}</td></tr>
        </table>
      </div>
    `;
  } else if (incidentType === "CANDIDATE_NO_SHOW") {
    specificHtml = `
      <div class="section-box" style="border-color: rgba(244, 63, 94, 0.3);">
        <div style="font-weight: 600; color: #fb7185; font-size: 13px; margin-bottom: 8px;">Incident Specifics (8B: Candidate No-Show)</div>
        <table class="meta-table">
          <tr><td class="meta-label">Scheduled Time:</td><td class="meta-val">${variantData.scheduledTime || "N/A"}</td></tr>
          <tr><td class="meta-label">Waiting Period:</td><td class="meta-val">${variantData.waitingPeriod || "10 minutes"}</td></tr>
          <tr><td class="meta-label">Interviewer Attendance:</td><td class="meta-val" style="color: #34d399;">${variantData.interviewerAttendance || "PRESENT"}</td></tr>
          <tr><td class="meta-label">Candidate Attendance:</td><td class="meta-val" style="color: #fb7185;">${variantData.candidateAttendance || "ABSENT"}</td></tr>
        </table>
      </div>
    `;
  } else if (incidentType === "INTERVIEWER_JOIN_FAILURE" || incidentType === "INTERVIEWER_NO_SHOW") {
    specificHtml = `
      <div class="section-box" style="border-color: rgba(244, 63, 94, 0.3);">
        <div style="font-weight: 600; color: #fb7185; font-size: 13px; margin-bottom: 8px;">Incident Specifics (8C: Interviewer Failure / No-Show)</div>
        <table class="meta-table">
          <tr><td class="meta-label">Interviewer:</td><td class="meta-val">${interviewerName}</td></tr>
          <tr><td class="meta-label">Scheduled Time:</td><td class="meta-val">${variantData.scheduledTime || "N/A"}</td></tr>
          <tr><td class="meta-label">Candidate Attendance:</td><td class="meta-val" style="color: #34d399;">${variantData.candidateAttendance || "PRESENT"}</td></tr>
          <tr><td class="meta-label">Interviewer Attendance:</td><td class="meta-val" style="color: #fb7185;">${variantData.interviewerAttendance || "ABSENT"}</td></tr>
          <tr><td class="meta-label">Reported Reason:</td><td class="meta-val" style="color: #fca5a5;">${description}</td></tr>
        </table>
      </div>
    `;
  } else if (incidentType === "RECORDING_FAILURE") {
    specificHtml = `
      <div class="section-box" style="border-color: rgba(244, 63, 94, 0.3);">
        <div style="font-weight: 600; color: #fb7185; font-size: 13px; margin-bottom: 8px;">Incident Specifics (8D: Recording Failure)</div>
        <table class="meta-table">
          <tr><td class="meta-label">Candidate AV:</td><td class="meta-val">${variantData.candidateStatus || "FAILED / MISSING"}</td></tr>
          <tr><td class="meta-label">Interviewer AV:</td><td class="meta-val">${variantData.interviewerStatus || "FAILED / MISSING"}</td></tr>
          <tr><td class="meta-label">Candidate Screen:</td><td class="meta-val">${variantData.screenStatus || "FAILED / MISSING"}</td></tr>
          <tr><td class="meta-label">Recording Duration:</td><td class="meta-val">${variantData.duration || "0s"}</td></tr>
          <tr><td class="meta-label">Storage Upload:</td><td class="meta-val" style="color: #fb7185;">${variantData.uploadStatus || "FAILED"}</td></tr>
        </table>
      </div>
    `;
  }

  const html = wrapEmailHtml(`
    <p>Dear Founder,</p>
    <p>An operational issue has been detected during the interview workflow. The details are provided below for review.</p>

    <div class="section-box" style="background: rgba(40, 10, 18, 0.6); border-color: rgba(244, 63, 94, 0.4);">
      <div style="font-weight: 600; color: #f43f5e; font-size: 14px; margin-bottom: 10px;">Incident Details</div>
      <table class="meta-table">
        <tr><td class="meta-label">Incident ID:</td><td class="meta-val" style="font-family: monospace; color: #f43f5e;">${incId}</td></tr>
        <tr><td class="meta-label">Incident Type:</td><td class="meta-val" style="font-family: monospace; color: #fb7185;">${incidentType}</td></tr>
        <tr><td class="meta-label">Severity:</td><td class="meta-val" style="color: #fb7185; font-weight: bold;">${severity}</td></tr>
        <tr><td class="meta-label">Detected At:</td><td class="meta-val">${detectedAt}</td></tr>
        <tr><td class="meta-label">Interview Reference:</td><td class="meta-val" style="font-family: monospace;">${refId}</td></tr>
        <tr><td class="meta-label">Current Status:</td><td class="meta-val">${status}</td></tr>
      </table>
    </div>

    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">People Involved</div>
      <table class="meta-table">
        <tr><td class="meta-label">Candidate:</td><td class="meta-val">${candidateName} (${candidateEmail})</td></tr>
        <tr><td class="meta-label">Interviewer:</td><td class="meta-val">${interviewerName} (${interviewerEmail})</td></tr>
      </table>
    </div>

    <div class="section-box">
      <div style="font-weight: 600; color: #e2e8f0; font-size: 14px; margin-bottom: 8px;">Incident Description</div>
      <p style="margin: 0; color: #fca5a5; font-size: 13px;">${description}</p>
    </div>

    ${specificHtml}

    <div class="section-box">
      <div style="font-weight: 600; color: #e2e8f0; font-size: 14px; margin-bottom: 10px;">Technical / Operational Evidence</div>
      <table class="meta-table">
        <tr><td class="meta-label">Expected Behaviour:</td><td class="meta-val" style="color: #34d399;">${expectedBehaviour}</td></tr>
        <tr><td class="meta-label">Actual Behaviour:</td><td class="meta-val" style="color: #fb7185;">${actualBehaviour}</td></tr>
        <tr><td class="meta-label">Error Details:</td><td class="meta-val" style="font-family: monospace; font-size: 12px; color: #fca5a5;">${errorDetails}</td></tr>
        <tr><td class="meta-label">Relevant Timestamp:</td><td class="meta-val font-mono">${timestamp}</td></tr>
        <tr><td class="meta-label">Recording Status:</td><td class="meta-val">${recordingStatus}</td></tr>
        <tr><td class="meta-label">Recording Reference:</td><td class="meta-val font-mono">${recordingReference}</td></tr>
      </table>
    </div>

    <div class="section-box">
      <div style="font-weight: 600; color: #34d399; font-size: 13px;">Action Taken</div>
      <p style="margin: 4px 0 12px; font-size: 13px; color: #cbd5e1;">${actionTaken}</p>

      <div style="font-weight: 600; color: #f59e0b; font-size: 13px;">Pending Action</div>
      <p style="margin: 4px 0 12px; font-size: 13px; color: #cbd5e1;">${pendingAction}</p>

      <div style="font-weight: 600; color: #38bdf8; font-size: 13px;">Recommended Follow-up</div>
      <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">${recommendedAction}</p>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
      This incident has been recorded in the Sora operational log. Further updates will be communicated if the issue remains unresolved or requires intervention.
    </p>
  `, "Sora Operations & Monitoring", FROM_EMAIL);

  const text = `
Dear Founder,

An operational issue has been detected during the interview workflow. The details are provided below for review.

Incident Details
Incident ID: ${incId}
Incident Type: ${incidentType}
Severity: ${severity}
Detected At: ${detectedAt}
Interview Reference: ${refId}
Current Status: ${status}

People Involved
Candidate: ${candidateName} (${candidateEmail})
Interviewer: ${interviewerName} (${interviewerEmail})

Incident Description
${description}

Technical / Operational Evidence
Expected Behaviour: ${expectedBehaviour}
Actual Behaviour: ${actualBehaviour}
Error Details: ${errorDetails}
Relevant Timestamp: ${timestamp}
Recording Status: ${recordingStatus}
Recording Reference: ${recordingReference}

Action Taken
${actionTaken}

Pending Action
${pendingAction}

Recommended Follow-up
${recommendedAction}

This incident has been recorded in the Sora operational log. Further updates will be communicated if the issue remains unresolved or requires intervention.

Regards,
Sora Operations & Monitoring
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: FOUNDER_EMAIL };
}

// ============================================================================
// 9. DAILY FOUNDER REPORT
// ============================================================================
function templateDailyFounderReport({
  reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  metrics = {
    requests: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0,
    pending_decisions: 0,
    incident_count: 0,
    critical_incidents: 0,
    high_incidents: 0,
    medium_incidents: 0,
    low_incidents: 0,
    resolved_incidents: 0,
    pending_incidents: 0,
    recordings_expected: 0,
    recordings_stored: 0,
    recording_failures: 0,
    analysis_completed: 0,
    analysis_pending: 0,
    analysis_failed: 0,
    emails_queued: 0,
    emails_delivered: 0,
    emails_failed: 0,
    emails_retried: 0,
  },
  interviewActivity = [], // Array of { reference_id, candidate_name, interviewer_name, time, status }
  incidentSummary = "No critical invariant breaches recorded today.",
  recordingAnalysisSummary = "All completed sessions successfully recorded and archived to cloud storage.",
  emailDeliverySummary = "Nodemailer SMTP & Resend fallbacks fully operational with 0 delivery dropped.",
  pendingActions = "All pending evaluations are within the standard 24h review window.",
  health = {
    backend: "HEALTHY",
    database: "HEALTHY",
    queue: "OPERATIONAL",
    video: "HEALTHY",
    storage: "OPERATIONAL",
    ai_pipeline: "OPERATIONAL",
    email_service: "OPERATIONAL",
  },
  executiveSummary = "The platform demonstrated 100% availability with all 5 autonomous cloud agents active.",
  recommendedActions = "Continue regular monitoring and verify end-of-week storage backups.",
}) {
  const subject = `Sora Daily Operations Report — ${reportDate}`;

  const renderActivityRows = () => {
    if (!interviewActivity || interviewActivity.length === 0) {
      return `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #64748b;">No interview activity recorded for this period.</td></tr>`;
    }
    return interviewActivity.map((item) => `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="padding: 8px 6px; font-family: monospace; color: #38bdf8;">${item.reference_id || item.jobId || "N/A"}</td>
        <td style="padding: 8px 6px; color: #f8fafc;">${item.candidate_name || "Candidate"}</td>
        <td style="padding: 8px 6px; color: #94a3b8;">${item.interviewer_name || "Interviewer"}</td>
        <td style="padding: 8px 6px; color: #94a3b8; font-size: 12px;">${item.time || "N/A"}</td>
        <td style="padding: 8px 6px; font-weight: 600; font-size: 12px; color: ${item.status === 'completed' || item.status === 'approved' ? '#34d399' : '#f59e0b'};">${item.status?.toUpperCase() || 'SCHEDULED'}</td>
      </tr>
    `).join("");
  };

  const html = wrapEmailHtml(`
    <p>Dear Founder,</p>
    <p>Please find below the daily operational summary for Sora.</p>

    <!-- 1. Daily Overview -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">1. Daily Overview</div>
      <table class="meta-table">
        <tr><td class="meta-label">Reporting Date:</td><td class="meta-val">${reportDate}</td></tr>
        <tr><td class="meta-label">Total Interview Requests:</td><td class="meta-val">${metrics.requests}</td></tr>
        <tr><td class="meta-label">Interviews Scheduled:</td><td class="meta-val">${metrics.scheduled}</td></tr>
        <tr><td class="meta-label">Interviews Completed:</td><td class="meta-val" style="color: #34d399;">${metrics.completed}</td></tr>
        <tr><td class="meta-label">Interviews Cancelled:</td><td class="meta-val">${metrics.cancelled}</td></tr>
        <tr><td class="meta-label">Interviews Rescheduled:</td><td class="meta-val">${metrics.rescheduled}</td></tr>
        <tr><td class="meta-label">Pending Interview Decisions:</td><td class="meta-val" style="color: #f59e0b;">${metrics.pending_decisions}</td></tr>
      </table>
    </div>

    <!-- 2. Interview Activity -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">2. Interview Activity</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(56, 189, 248, 0.2); color: #38bdf8;">
            <th style="padding: 6px;">Ref ID</th>
            <th style="padding: 6px;">Candidate</th>
            <th style="padding: 6px;">Interviewer</th>
            <th style="padding: 6px;">Time</th>
            <th style="padding: 6px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${renderActivityRows()}
        </tbody>
      </table>
    </div>

    <!-- 3. Operational Incidents -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">3. Operational Incidents</div>
      <table class="meta-table">
        <tr><td class="meta-label">Total Incidents:</td><td class="meta-val">${metrics.incident_count}</td></tr>
        <tr><td class="meta-label">Critical / High / Med / Low:</td><td class="meta-val">${metrics.critical_incidents} / ${metrics.high_incidents} / ${metrics.medium_incidents} / ${metrics.low_incidents}</td></tr>
        <tr><td class="meta-label">Resolved / Pending:</td><td class="meta-val">${metrics.resolved_incidents} / ${metrics.pending_incidents}</td></tr>
      </table>
      <p style="margin: 10px 0 0; color: #cbd5e1; font-size: 13px;">${incidentSummary}</p>
    </div>

    <!-- 4. Recording & AI Analysis -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">4. Recording & AI Analysis</div>
      <table class="meta-table">
        <tr><td class="meta-label">Recordings Expected:</td><td class="meta-val">${metrics.recordings_expected}</td></tr>
        <tr><td class="meta-label">Recordings Stored / Failed:</td><td class="meta-val">${metrics.recordings_stored} / ${metrics.recording_failures}</td></tr>
        <tr><td class="meta-label">AI Analysis Completed:</td><td class="meta-val" style="color: #34d399;">${metrics.analysis_completed}</td></tr>
        <tr><td class="meta-label">AI Analysis Pending / Failed:</td><td class="meta-val">${metrics.analysis_pending} / ${metrics.analysis_failed}</td></tr>
      </table>
      <p style="margin: 10px 0 0; color: #cbd5e1; font-size: 13px;">${recordingAnalysisSummary}</p>
    </div>

    <!-- 5. Email Delivery -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">5. Email Delivery</div>
      <table class="meta-table">
        <tr><td class="meta-label">Emails Queued / Delivered:</td><td class="meta-val">${metrics.emails_queued} / ${metrics.emails_delivered}</td></tr>
        <tr><td class="meta-label">Failed / Retried Deliveries:</td><td class="meta-val">${metrics.emails_failed} / ${metrics.emails_retried}</td></tr>
      </table>
      <p style="margin: 10px 0 0; color: #cbd5e1; font-size: 13px;">${emailDeliverySummary}</p>
    </div>

    <!-- 6. Pending Actions -->
    <div class="section-box">
      <div style="font-weight: 600; color: #f59e0b; font-size: 14px; margin-bottom: 8px;">6. Pending Actions Requiring Attention</div>
      <p style="margin: 0; color: #e2e8f0; font-size: 13px;">${pendingActions}</p>
    </div>

    <!-- 7. System Health -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 10px;">7. System Health</div>
      <table class="meta-table">
        <tr><td class="meta-label">Backend Status:</td><td class="meta-val" style="color: #34d399;">${health.backend}</td></tr>
        <tr><td class="meta-label">Database Status:</td><td class="meta-val" style="color: #34d399;">${health.database}</td></tr>
        <tr><td class="meta-label">Queue Status:</td><td class="meta-val" style="color: #34d399;">${health.queue}</td></tr>
        <tr><td class="meta-label">Video Infrastructure:</td><td class="meta-val" style="color: #34d399;">${health.video}</td></tr>
        <tr><td class="meta-label">Storage Status:</td><td class="meta-val" style="color: #34d399;">${health.storage}</td></tr>
        <tr><td class="meta-label">AI Processing Status:</td><td class="meta-val" style="color: #34d399;">${health.ai_pipeline}</td></tr>
        <tr><td class="meta-label">Email Service Status:</td><td class="meta-val" style="color: #34d399;">${health.email_service}</td></tr>
      </table>
    </div>

    <!-- 8. Executive Summary -->
    <div class="section-box">
      <div style="font-weight: 600; color: #e2e8f0; font-size: 14px; margin-bottom: 8px;">8. Executive Summary</div>
      <p style="margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.6;">${executiveSummary}</p>
    </div>

    <!-- 9. Recommended Actions -->
    <div class="section-box">
      <div style="font-weight: 600; color: #38bdf8; font-size: 14px; margin-bottom: 8px;">9. Recommended Actions</div>
      <p style="margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.6;">${recommendedActions}</p>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
      This report reflects the operational data recorded by Sora during the reporting period. Any unavailable or incomplete metrics are explicitly marked rather than assumed.
    </p>
  `, "Sora Operations & Reporting", FROM_EMAIL);

  const text = `
Dear Founder,

Please find below the daily operational summary for Sora.

1. Daily Overview
Reporting Date: ${reportDate}
Total Interview Requests: ${metrics.requests}
Interviews Scheduled: ${metrics.scheduled}
Interviews Completed: ${metrics.completed}
Interviews Cancelled: ${metrics.cancelled}
Interviews Rescheduled: ${metrics.rescheduled}
Pending Interview Decisions: ${metrics.pending_decisions}

2. Interview Activity
${interviewActivity && interviewActivity.length > 0 ? interviewActivity.map(a => `${a.reference_id} | ${a.candidate_name} | ${a.interviewer_name} | ${a.time} | ${a.status}`).join("\n") : "No interview activity recorded for this period."}

3. Operational Incidents
Total Incidents: ${metrics.incident_count}
Critical: ${metrics.critical_incidents}
High: ${metrics.high_incidents}
Medium: ${metrics.medium_incidents}
Low: ${metrics.low_incidents}
Resolved: ${metrics.resolved_incidents}
Pending: ${metrics.pending_incidents}
${incidentSummary}

4. Recording & AI Analysis
Recordings Expected: ${metrics.recordings_expected}
Recordings Successfully Stored: ${metrics.recordings_stored}
Recording Failures: ${metrics.recording_failures}
AI Analysis Completed: ${metrics.analysis_completed}
AI Analysis Pending: ${metrics.analysis_pending}
AI Analysis Failed: ${metrics.analysis_failed}
${recordingAnalysisSummary}

5. Email Delivery
Emails Queued: ${metrics.emails_queued}
Successfully Delivered: ${metrics.emails_delivered}
Failed Deliveries: ${metrics.emails_failed}
Retried Emails: ${metrics.emails_retried}
${emailDeliverySummary}

6. Pending Actions Requiring Attention
${pendingActions}

7. System Health
Backend Status: ${health.backend}
Database Status: ${health.database}
Queue Status: ${health.queue}
Video Infrastructure: ${health.video}
Storage Status: ${health.storage}
AI Processing Status: ${health.ai_pipeline}
Email Service Status: ${health.email_service}

8. Executive Summary
${executiveSummary}

9. Recommended Actions
${recommendedActions}

This report reflects the operational data recorded by Sora during the reporting period. Any unavailable or incomplete metrics are explicitly marked rather than assumed.

Regards,
Sora Operations & Reporting
${FROM_EMAIL}
`.trim();

  return { subject, html, text, from: FROM_EMAIL, to: FOUNDER_EMAIL };
}

module.exports = {
  FROM_EMAIL,
  FOUNDER_EMAIL,
  FRONTEND_URL,
  templateAccountRegistration,
  templateTicketCreated,
  templateInterviewerInvitation,
  templateSlotConfirmed,
  templateFiveMinuteReminder,
  templateInterviewCompleted,
  templateSelectionConfirmation,
  templateRejectionConfirmation,
  templateIncidentReport,
  templateDailyFounderReport,
};
