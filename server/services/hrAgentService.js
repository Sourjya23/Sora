const Meeting = require("../models/Meeting");
const InterviewTicket = require("../models/InterviewTicket");
const User = require("../models/User");
const { sendEmail } = require("../utils/emailService");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

// Helper: Format human-readable date & time
const formatDateTime = (timeVal) => {
  if (!timeVal) return "Scheduled Slot TBD";
  const date = new Date(timeVal);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

/**
 * 1. CANDIDATE INVITE EMAIL TEMPLATE
 * Professional, encouraging, clear instructions on screen sharing, environment, and meeting credentials.
 */
const buildCandidateInviteEmail = ({
  candidateName,
  interviewerName,
  scheduledTime,
  meetingUrl,
  keyPassword,
  jobId,
  jobDescription,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Technical Assessment on Sora</title>
</head>
<body style="margin: 0; padding: 0; background-color: #03101b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background: linear-gradient(145deg, #062438 0%, #041a2a 60%, #02101b 100%); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 36px 20px; border-bottom: 1px solid rgba(56, 189, 248, 0.15);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 26px; color: #ffffff; letter-spacing: -0.5px;">Sora</span>
                    <span style="font-size: 11px; font-family: monospace; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 6px; margin-left: 8px; border: 1px solid rgba(56, 189, 248, 0.3);">HR OPS</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-family: monospace; color: #94a3b8;">${jobId || "TECH-LOOP"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 12px;">Your Technical Assessment is Confirmed! 🚀</h1>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Dear <strong style="color: #ffffff;">${candidateName}</strong>,<br/>
                Your technical interview assessment for <strong style="color: #38bdf8;">${jobId || "Software Engineer"}</strong> has been locked with your verified mentor, <strong style="color: #ffffff;">${interviewerName}</strong>.
              </p>

              <!-- Session Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(4, 26, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: monospace;">Session Schedule</p>
                    <p style="margin: 0 0 16px; color: #38bdf8; font-size: 16px; font-weight: 600;">${formatDateTime(scheduledTime)}</p>
                    
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: monospace;">Room Passcode Key</p>
                    <div style="display: inline-block; background: #031320; border: 1px solid #0284c7; padding: 8px 16px; border-radius: 8px; color: #38bdf8; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
                      ${keyPassword || "PASS-VERIFY"}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${meetingUrl}" target="_blank" style="background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%); color: #02101b; text-decoration: none; padding: 14px 36px; border-radius: 9999px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 10px 25px rgba(56, 189, 248, 0.35);">
                      Enter Live Assessment Room &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Candidate Instructions Checklist -->
              <div style="background: rgba(8, 34, 53, 0.5); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 16px; padding: 20px; margin-top: 24px;">
                <p style="margin: 0 0 12px; color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Candidate Checklist & Guidelines</p>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;"><strong>Mandatory Screen Sharing:</strong> The code editor unlocks only after you share your entire screen. This ensures integrity and allows your mentor to review your problem-solving flow.</li>
                  <li style="margin-bottom: 8px;"><strong>Multi-Language Code Runner:</strong> You can code in Python, JavaScript, Java, C++, or C with real-time test execution.</li>
                  <li style="margin-bottom: 8px;"><strong>Think Aloud:</strong> Explain your thought process, state time/space complexity tradeoffs, and walk through edge cases.</li>
                  <li><strong>Hardware Check:</strong> Join 5 minutes early to complete your microphone and webcam verification in the pre-join lobby.</li>
                </ul>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(56, 189, 248, 0.15); padding-top: 18px; line-height: 1.5;">
                Need help or have technical questions? Reply directly to this email.<br/>
                Best regards,<br/>
                <strong style="color: #94a3b8;">Sora HR & Assessment Coordination Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * 2. INTERVIEWER BRIEFING EMAIL TEMPLATE
 * Executive, mentor-oriented layout with candidate profile, resume, evaluation rubric, and meeting link.
 */
const buildInterviewerInviteEmail = ({
  interviewerName,
  candidateName,
  candidateEmail,
  resumeUrl,
  scheduledTime,
  meetingUrl,
  keyPassword,
  jobId,
  jobDescription,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mentor Briefing: Scheduled Interview</title>
</head>
<body style="margin: 0; padding: 0; background-color: #03101b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background: linear-gradient(145deg, #082235 0%, #041a2a 60%, #02101b 100%); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 36px 20px; border-bottom: 1px solid rgba(56, 189, 248, 0.15);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 26px; color: #ffffff;">Sora</span>
                    <span style="font-size: 11px; font-family: monospace; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 6px; margin-left: 8px; border: 1px solid rgba(56, 189, 248, 0.3);">MENTOR BRIEF</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-family: monospace; color: #94a3b8;">${jobId || "TECH-LOOP"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 12px;">Candidate Assessment Assignment 📋</h1>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Hello <strong style="color: #ffffff;">${interviewerName}</strong>,<br/>
                You are confirmed to conduct the technical assessment loop for candidate <strong style="color: #38bdf8;">${candidateName}</strong> for <strong style="color: #ffffff;">${jobId || "Software Engineer"}</strong>.
              </p>

              <!-- Candidate Summary Dossier -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(4, 26, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 8px; color: #94a3b8; font-size: 13px;">Candidate:</td>
                        <td style="padding-bottom: 8px; color: #ffffff; font-size: 13px; font-weight: 600;">${candidateName} (${candidateEmail})</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: #94a3b8; font-size: 13px;">Scheduled Slot:</td>
                        <td style="padding-bottom: 8px; color: #38bdf8; font-size: 13px; font-weight: 600;">${formatDateTime(scheduledTime)}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: #94a3b8; font-size: 13px;">Passcode Key:</td>
                        <td style="padding-bottom: 8px; color: #38bdf8; font-family: monospace; font-size: 14px; font-weight: bold;">${keyPassword || "PASS-VERIFY"}</td>
                      </tr>
                      ${
                        resumeUrl
                          ? `
                      <tr>
                        <td style="color: #94a3b8; font-size: 13px;">Resume:</td>
                        <td><a href="${resumeUrl}" target="_blank" style="color: #38bdf8; font-size: 13px; text-decoration: underline;">View Candidate Resume &rarr;</a></td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Join CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${meetingUrl}" target="_blank" style="background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%); color: #02101b; text-decoration: none; padding: 14px 36px; border-radius: 9999px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 10px 25px rgba(56, 189, 248, 0.35);">
                      Open Interviewer Room &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Evaluation Rubric Breakdown -->
              <div style="background: rgba(8, 34, 53, 0.5); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 16px; padding: 20px; margin-top: 24px;">
                <p style="margin: 0 0 12px; color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Evaluation Rubric</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="color: #cbd5e1; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0;"><strong>Problem Solving & Decomposition (40%):</strong> Structural approach, pattern recognition, and edge case probing.</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;"><strong>Code Quality & Correctness (30%):</strong> Clean modular syntax, boundary conditions, and test execution results.</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;"><strong>Complexity & Tradeoffs (15%):</strong> Clear Big-O analysis in runtime and memory.</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;"><strong>Communication (15%):</strong> Collaborative clarity and reception to hints.</td>
                  </tr>
                </table>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(56, 189, 248, 0.15); padding-top: 18px; line-height: 1.5;">
                Following the session, the Sora AI engine will automatically generate the forensic report and scoring matrix for your transparent verdict submission.<br/>
                &mdash; <strong style="color: #94a3b8;">Sora HR Coordinator</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * 3. CANDIDATE SELECTION EMAIL TEMPLATE
 * Celebratory, highly personalized, highlighting standout achievements from AI & mentor review.
 */
const buildCandidateSelectionEmail = ({
  candidateName,
  interviewerName,
  jobId,
  aiVerdict = {},
  interviewerNotes = "",
}) => {
  const strengths =
    aiVerdict.strengths && aiVerdict.strengths.length > 0
      ? aiVerdict.strengths
      : [
          "Demonstrated rigorous algorithmic intuition and structured problem decomposition.",
          "Wrote clean, modular code with sound time and space complexity handling.",
          "Maintained strong communication throughout the live coding loop.",
        ];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Congratulations! Selected for ${jobId || "Role"} on Sora</title>
</head>
<body style="margin: 0; padding: 0; background-color: #03101b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background: linear-gradient(145deg, #062e24 0%, #041a2a 60%, #02101b 100%); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 36px 20px; border-bottom: 1px solid rgba(52, 211, 153, 0.2);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 26px; color: #ffffff;">Sora</span>
                    <span style="font-size: 11px; font-family: monospace; background: rgba(52, 211, 153, 0.2); color: #34d399; padding: 3px 8px; border-radius: 6px; margin-left: 8px; border: 1px solid rgba(52, 211, 153, 0.4);">SELECTED</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-family: monospace; color: #94a3b8;">${jobId || "TECH-OFFER"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="color: #34d399; font-size: 24px; font-weight: 700; margin: 0 0 12px;">Congratulations, ${candidateName}! 🎉</h1>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                We are thrilled to share that following your technical assessment loop with <strong style="color: #ffffff;">${interviewerName}</strong>, both your interviewer and the Sora AI Assessment Engine have reached a unanimous verdict: <strong style="color: #34d399;">Selected</strong>!
              </p>

              <!-- Highlights Card -->
              <div style="background: rgba(4, 34, 25, 0.6); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; color: #34d399; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Assessment Highlights</p>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                  ${strengths.map((s) => `<li style="margin-bottom: 6px;">${s}</li>`).join("")}
                </ul>
                ${
                  interviewerNotes
                    ? `
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(52, 211, 153, 0.2); font-size: 13px; color: #e2e8f0; font-style: italic;">
                  "${interviewerNotes}" &mdash; ${interviewerName}
                </div>
                `
                    : ""
                }
              </div>

              <!-- Next Steps -->
              <div style="background: rgba(8, 34, 53, 0.5); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Next Steps in the Hiring Process</p>
                <p style="margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                  Our hiring team will be in touch within 24 to 48 hours to discuss the formal offer package, role specifics, and onboarding timeline.
                </p>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(56, 189, 248, 0.15); padding-top: 18px; line-height: 1.5;">
                Welcome to the next phase of your engineering journey!<br/>
                Warm regards,<br/>
                <strong style="color: #94a3b8;">Sora HR & Engineering Talent Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * 4. CANDIDATE REJECTION EMAIL TEMPLATE
 * Respectful, empowering, constructive, providing actionable feedback rather than a generic brush-off.
 */
const buildCandidateRejectionEmail = ({
  candidateName,
  interviewerName,
  jobId,
  aiVerdict = {},
  interviewerNotes = "",
}) => {
  const growthAreas =
    aiVerdict.growthAreas && aiVerdict.growthAreas.length > 0
      ? aiVerdict.growthAreas
      : [
          "Focus on testing boundary and edge cases systematically before submitting code.",
          "Practice optimizing nested loops to achieve linear O(N) or logarithmic runtime where applicable.",
        ];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Update on your Technical Assessment (${jobId || "Sora"})</title>
</head>
<body style="margin: 0; padding: 0; background-color: #03101b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background: linear-gradient(145deg, #082235 0%, #041a2a 60%, #02101b 100%); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 36px 20px; border-bottom: 1px solid rgba(56, 189, 248, 0.15);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-family: Georgia, serif; font-size: 26px; color: #ffffff;">Sora</span>
                    <span style="font-size: 11px; font-family: monospace; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 6px; margin-left: 8px;">ASSESSMENT UPDATE</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-family: monospace; color: #94a3b8;">${jobId || "TECH-LOOP"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 12px;">Hello ${candidateName},</h1>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                Thank you for completing your technical assessment with <strong style="color: #ffffff;">${interviewerName}</strong> for <strong style="color: #38bdf8;">${jobId || "Software Engineer"}</strong> on Sora.
              </p>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                While the evaluation panel appreciated your dedication and problem-solving effort during the round, we have decided not to advance with an offer for this particular hiring cycle.
              </p>

              <!-- Constructive Takeaways Card -->
              <div style="background: rgba(4, 26, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px; color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Key Takeaways for Future Prep</p>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                  ${growthAreas.map((g) => `<li style="margin-bottom: 6px;">${g}</li>`).join("")}
                </ul>
                ${
                  interviewerNotes
                    ? `
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(56, 189, 248, 0.15); font-size: 13px; color: #94a3b8; font-style: italic;">
                  Mentor feedback: "${interviewerNotes}"
                </div>
                `
                    : ""
                }
              </div>

              <!-- Practice & Re-application Invitation -->
              <div style="background: rgba(8, 34, 53, 0.5); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #ffffff; font-size: 13px; font-weight: 600;">Continuing Your Journey on Sora</p>
                <p style="margin: 0 0 14px; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
                  We encourage you to hone your algorithmic fluency on Sora's interactive problem sets. Candidates who complete 15+ practice rounds show a 4x increase in subsequent pass rates.
                </p>
                <a href="https://sorabuild.netlify.app/practice" target="_blank" style="color: #38bdf8; font-size: 13px; font-weight: 600; text-decoration: underline;">
                  Practice on Sora's Adaptive Problem Bank &rarr;
                </a>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(56, 189, 248, 0.15); padding-top: 18px; line-height: 1.5;">
                We are grateful for your time and wish you continued success in your engineering endeavors.<br/>
                Sincerely,<br/>
                <strong style="color: #94a3b8;">Sora HR & Candidate Experience Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * 5. CORE HR AGENT ACTIONS
 */

// A. Dispatch Custom Invites to Both Candidate & Interviewer
exports.dispatchCustomInvites = async (meetingId) => {
  try {
    const meeting = await Meeting.findOne({ meetingId })
      .populate("candidateId", "name email resumeUrl")
      .populate("interviewerId", "name email");

    if (!meeting || !meeting.candidateId || !meeting.interviewerId) {
      console.warn(`[HRAgent] Cannot dispatch invites: meeting or participants missing for ${meetingId}`);
      return false;
    }

    const { candidateId: candidate, interviewerId: interviewer } = meeting;

    // 1. Send customized candidate invite
    const candidateHtml = buildCandidateInviteEmail({
      candidateName: candidate.name,
      interviewerName: interviewer.name,
      scheduledTime: meeting.scheduledTime,
      meetingUrl: meeting.meetingUrl,
      keyPassword: meeting.keyPassword,
      jobId: meeting.jobId,
      jobDescription: meeting.jobDescription,
    });

    await sendEmail({
      to: candidate.email,
      subject: `Technical Assessment Confirmed: ${meeting.jobId || "Job"} on Sora`,
      html: candidateHtml,
      replyTo: interviewer.email,
    });

    // 2. Send customized interviewer mentor briefing
    const interviewerHtml = buildInterviewerInviteEmail({
      interviewerName: interviewer.name,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      resumeUrl: meeting.resumeUrl || candidate.resumeUrl,
      scheduledTime: meeting.scheduledTime,
      meetingUrl: meeting.meetingUrl,
      keyPassword: meeting.keyPassword,
      jobId: meeting.jobId,
      jobDescription: meeting.jobDescription,
    });

    await sendEmail({
      to: interviewer.email,
      subject: `Mentor Briefing: Assessment with ${candidate.name} (${meeting.jobId || "Job"})`,
      html: interviewerHtml,
    });

    // Update meeting HR workflow state
    meeting.hrWorkflow = meeting.hrWorkflow || {};
    meeting.hrWorkflow.inviteSentCandidate = true;
    meeting.hrWorkflow.inviteSentInterviewer = true;
    meeting.hrWorkflow.stage = "invited";
    meeting.hrWorkflow.history = meeting.hrWorkflow.history || [];
    meeting.hrWorkflow.history.push({
      event: "invites_dispatched",
      details: `Custom invitations sent to candidate (${candidate.email}) and interviewer (${interviewer.email})`,
      timestamp: new Date(),
    });

    await meeting.save();
    console.log(`[HRAgent] Distinct invitations successfully sent for meeting ${meetingId}`);
    return true;
  } catch (error) {
    console.error(`[HRAgent] Error dispatching custom invites:`, error);
    return false;
  }
};

// B. Deep AI Analysis & Verdict Generation
exports.generateAIAnalysisAndVerdict = async ({
  meetingId,
  recordingUrl,
  finalCode,
  problemStatement,
  telemetryEvents = [],
}) => {
  try {
    console.log(`[HRAgent] Running AI assessment synthesis for meeting ${meetingId}`);

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    const events = Array.isArray(telemetryEvents) ? telemetryEvents : [];
    const tabSwitches = events.filter((e) => e.type === "tab_change" || e.type === "visibilitychange");
    const pastes = events.filter((e) => e.type === "paste");

    // Default heuristic scores
    let technicalScore = 75;
    let integrityScore = 100 - (tabSwitches.length * 8 + pastes.length * 10);
    if (integrityScore < 30) integrityScore = 30;

    let problemSolvingScore = 78;
    let verdict = "Hire";
    let confidenceScore = 88;

    const code = (finalCode || "").trim();
    if (code.length < 30 || code.includes("Write your solution here")) {
      technicalScore = 35;
      problemSolvingScore = 40;
      verdict = "No Hire";
      confidenceScore = 95;
    } else if (integrityScore < 50) {
      verdict = "Leaning No Hire";
      confidenceScore = 82;
    } else if (technicalScore >= 85 && integrityScore >= 85) {
      verdict = "Strong Hire";
      confidenceScore = 92;
    }

    let strengths = [
      "Structured solution approach with standard language conventions.",
      "Maintained focused screen sharing throughout the implementation.",
    ];

    let growthAreas = [
      "Incorporate unit boundary tests before running final solution.",
      "Explore logarithmic or linear space optimization techniques.",
    ];

    let summary = `Candidate completed technical assessment. Identified ${tabSwitches.length} tab switch(es) and ${pastes.length} clipboard paste(s). Integrity index computed at ${integrityScore}/100 with technical baseline score of ${technicalScore}/100.`;

    // Attempt Gemini deep synthesis if configured
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
You are the Sora AI Talent Evaluator. Analyze this live technical interview:
Problem:
${problemStatement || "Technical coding challenge"}

Candidate Code:
${finalCode || "No code submitted"}

Telemetry Events: ${JSON.stringify(events)}

Evaluate and return ONLY valid JSON matching this schema:
{
  "verdict": "Strong Hire" | "Hire" | "Leaning No Hire" | "No Hire",
  "confidenceScore": number (50-100),
  "technicalScore": number (0-100),
  "integrityScore": number (0-100),
  "problemSolvingScore": number (0-100),
  "summary": "2-3 sentences concise assessment summary",
  "strengths": ["strength 1", "strength 2"],
  "growthAreas": ["growth area 1", "growth area 2"]
}
`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          verdict = parsed.verdict || verdict;
          confidenceScore = parsed.confidenceScore || confidenceScore;
          technicalScore = parsed.technicalScore || technicalScore;
          integrityScore = parsed.integrityScore || integrityScore;
          problemSolvingScore = parsed.problemSolvingScore || problemSolvingScore;
          summary = parsed.summary || summary;
          if (Array.isArray(parsed.strengths) && parsed.strengths.length > 0) strengths = parsed.strengths;
          if (Array.isArray(parsed.growthAreas) && parsed.growthAreas.length > 0) growthAreas = parsed.growthAreas;
        }
      } catch (geminiErr) {
        console.warn(`[HRAgent] Gemini deep evaluation fallback:`, geminiErr.message);
      }
    }

    const aiVerdictPayload = {
      verdict,
      confidenceScore,
      technicalScore,
      integrityScore,
      problemSolvingScore,
      summary,
      strengths,
      growthAreas,
      analyzedAt: new Date(),
    };

    // Update meeting record
    meeting.aiVerdict = aiVerdictPayload;
    meeting.hrWorkflow = meeting.hrWorkflow || {};
    meeting.hrWorkflow.videoStored = Boolean(recordingUrl || meeting.recordingUrl);
    meeting.hrWorkflow.stage = "decision_ready";
    meeting.hrWorkflow.history = meeting.hrWorkflow.history || [];
    meeting.hrWorkflow.history.push({
      event: "ai_analysis_completed",
      details: `AI Verdict: ${verdict} (${confidenceScore}% confidence). Technical: ${technicalScore}, Integrity: ${integrityScore}`,
      timestamp: new Date(),
    });

    await meeting.save();
    console.log(`[HRAgent] AI verdict saved for meeting ${meetingId}: ${verdict}`);
    return aiVerdictPayload;
  } catch (error) {
    console.error(`[HRAgent] Error generating AI analysis:`, error);
    return null;
  }
};

// C. Finalize Selection/Rejection Decision & Dispatch Custom Candidate Notification
exports.finalizeDecisionAndNotifyCandidate = async ({
  meetingId,
  decision, // "selected" | "rejected"
  interviewerRating = 0,
  interviewerVerdict = "",
  interviewerNotes = "",
  decidedBy = null,
}) => {
  try {
    const meeting = await Meeting.findOne({ meetingId })
      .populate("candidateId")
      .populate("interviewerId");

    if (!meeting) {
      throw new Error(`Meeting not found for ID: ${meetingId}`);
    }

    const isSelected = decision === "selected" || decision === "approved";
    const finalStatus = isSelected ? "approved" : "rejected";

    // Update meeting details
    meeting.status = finalStatus;
    meeting.interviewerFeedback = {
      rating: Number(interviewerRating) || 0,
      verdict: interviewerVerdict || (isSelected ? "Hire" : "No Hire"),
      notes: interviewerNotes || "",
      submittedAt: new Date(),
    };

    meeting.finalDecision = {
      decision: isSelected ? "selected" : "rejected",
      decidedBy: decidedBy || meeting.interviewerId?._id,
      decidedAt: new Date(),
      notes: interviewerNotes,
      customEmailSent: false,
    };

    meeting.hrWorkflow = meeting.hrWorkflow || {};
    meeting.hrWorkflow.stage = "decided";
    meeting.hrWorkflow.history = meeting.hrWorkflow.history || [];
    meeting.hrWorkflow.history.push({
      event: "decision_finalized",
      details: `Candidate marked as ${isSelected ? "SELECTED" : "REJECTED"} by interviewer.`,
      timestamp: new Date(),
    });

    // Update associated InterviewTicket
    await InterviewTicket.updateOne(
      { meetingId },
      { $set: { status: finalStatus } }
    );

    // Send the custom selection/rejection email to the candidate
    const candidate = meeting.candidateId;
    const interviewer = meeting.interviewerId;

    if (candidate && candidate.email) {
      const emailHtml = isSelected
        ? buildCandidateSelectionEmail({
            candidateName: candidate.name,
            interviewerName: interviewer?.name || "Your Interviewer",
            jobId: meeting.jobId,
            aiVerdict: meeting.aiVerdict || {},
            interviewerNotes,
          })
        : buildCandidateRejectionEmail({
            candidateName: candidate.name,
            interviewerName: interviewer?.name || "Your Interviewer",
            jobId: meeting.jobId,
            aiVerdict: meeting.aiVerdict || {},
            interviewerNotes,
          });

      const subject = isSelected
        ? `Congratulations! You have been selected for ${meeting.jobId || "Role"} on Sora 🎉`
        : `Update regarding your technical assessment on Sora (${meeting.jobId || "Assessment"})`;

      await sendEmail({
        to: candidate.email,
        subject,
        html: emailHtml,
      });

      meeting.finalDecision.customEmailSent = true;
      meeting.finalDecision.customEmailSentAt = new Date();
      console.log(`[HRAgent] Custom ${finalStatus} email delivered to ${candidate.email}`);
    }

    await meeting.save();
    return {
      success: true,
      status: finalStatus,
      meeting,
    };
  } catch (error) {
    console.error(`[HRAgent] Error finalizing decision:`, error);
    throw error;
  }
};
