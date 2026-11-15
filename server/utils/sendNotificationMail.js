const { sendEmail } = require("./emailService");

const sendNotificationMail = async (
  interviewerEmail,
  candidateName,
  candidateEmail,
  jobId,
  jobDescription,
  slotStart,
  slotEnd,
  resumeUrl
) => {
  try {
    const formatSlot = (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const subject = `New Interview Requested: ${candidateName} for ${jobId}`;
    const frontendUrl = process.env.FRONTEND_URL || "https://sorabuild.netlify.app";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; background-color: #041826; color: #e2e8f0; border-radius: 16px;">
        <h2 style="color: #38bdf8; margin-top: 0;">New Interview Request</h2>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
          A candidate has raised an evaluation ticket and proposed preferred slots.
        </p>
        
        <div style="background-color: #07243a; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #0e3d60;">
          <p style="margin: 6px 0; color: #cbd5e1;"><strong>Candidate:</strong> ${candidateName} (<span style="color: #38bdf8;">${candidateEmail}</span>)</p>
          <p style="margin: 6px 0; color: #cbd5e1;"><strong>Job ID:</strong> <span style="font-family: monospace; color: #ffffff;">${jobId}</span></p>
          <p style="margin: 8px 0 4px 0; color: #cbd5e1;"><strong>Proposed Time Slot:</strong></p>
          <p style="margin: 0; padding-left: 12px; color: #38bdf8; font-weight: bold;">
            Start: ${formatSlot(slotStart)}<br/>
            End: ${formatSlot(slotEnd)}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="margin-bottom: 6px; color: #e2e8f0;">Job Description:</h4>
          <p style="color: #94a3b8; font-size: 14px; background-color: #03131f; padding: 14px; border: 1px solid #1e293b; border-radius: 8px; white-space: pre-wrap; line-height: 1.5;">${jobDescription}</p>
        </div>

        ${
          resumeUrl
            ? `
        <div style="margin: 24px 0;">
          <a href="${resumeUrl}" target="_blank" rel="noreferrer" style="background-color: #0ea5e9; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 13px;">
            View Candidate Resume &rarr;
          </a>
        </div>
        `
            : ""
        }

        <div style="margin: 32px 0; text-align: center;">
          <a href="${frontendUrl}/interviewer-dashboard" style="background-color: #ffffff; color: #041826; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block; font-size: 15px;">
            Open Dashboard to Schedule &rarr;
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 14px;">
          Log in to your Sora dashboard to review this request and confirm the schedule.
        </p>
      </div>
    `;

    await sendEmail({
      to: interviewerEmail,
      subject,
      html,
      replyTo: candidateEmail || undefined,
    });

    console.log("[sendNotificationMail] Interviewer notification sent to:", interviewerEmail);
  } catch (error) {
    console.error("[sendNotificationMail] Error sending notification mail:", error);
  }
};

module.exports = sendNotificationMail;
