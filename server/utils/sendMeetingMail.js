const { sendEmail } = require("./emailService");

const sendMeetingMail = async (
  toEmail,
  type,
  meetingUrl,
  otherPersonName,
  senderEmail,
  keyPassword = "",
  scheduledTime = null
) => {
  try {
    const formatTime = (timeStr) => {
      if (!timeStr) return "Not specified";
      const d = new Date(timeStr);
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

    let subject = "";
    let html = "";

    if (type === "invite") {
      subject = "Technical Assessment Scheduled: Join Meeting on Sora";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; background-color: #041826; color: #e2e8f0; border-radius: 16px;">
          <h2 style="color: #38bdf8; margin-top: 0;">Your Interview has been Scheduled!</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Your interviewer <strong style="color: #ffffff;">${otherPersonName}</strong> has confirmed and locked your technical assessment meeting room.
          </p>
          
          <div style="background-color: #07243a; padding: 18px; border-radius: 12px; margin: 24px 0; border: 1px solid #0e3d60;">
            <p style="margin: 6px 0; color: #cbd5e1;"><strong>Scheduled Time:</strong> <span style="color: #38bdf8; font-weight: bold;">${formatTime(scheduledTime)}</span></p>
            ${
              keyPassword
                ? `<p style="margin: 12px 0 6px 0; color: #cbd5e1;"><strong>Key Password to Enter:</strong> <span style="font-family: monospace; background-color: #03131f; padding: 6px 12px; border-radius: 6px; font-weight: bold; color: #38bdf8; font-size: 17px; letter-spacing: 2px; border: 1px solid #0ea5e9;">${keyPassword}</span></p>`
                : ""
            }
          </div>

          <div style="margin: 32px 0; text-align: center;">
            <a href="${meetingUrl}" style="background-color: #ffffff; color: #041826; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block; font-size: 15px;">
              Join Meeting Room &rarr;
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 16px;">
            Please ensure you are using a modern browser (Chrome or Firefox), grant microphone and camera permissions, and enter your password key when prompted.
          </p>
        </div>
      `;
    } else if (type === "joined") {
      subject = `Candidate ${otherPersonName} Joined the Meeting`;
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; background-color: #041826; color: #e2e8f0; border-radius: 16px;">
          <h2 style="color: #34d399; margin-top: 0;">Candidate is Waiting in Room</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            The candidate <strong style="color: #ffffff;">${otherPersonName}</strong> has just entered the meeting room.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${meetingUrl}" style="background-color: #ffffff; color: #041826; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block; font-size: 15px;">
              Join Meeting Room &rarr;
            </a>
          </div>
        </div>
      `;
    }

    await sendEmail({
      to: toEmail,
      subject,
      html,
      replyTo: senderEmail || undefined,
    });

    console.log(`[sendMeetingMail] Meeting mail sent to: ${toEmail} (${type})`);
  } catch (error) {
    console.error("[sendMeetingMail] Error sending meeting mail:", error);
  }
};

module.exports = sendMeetingMail;
