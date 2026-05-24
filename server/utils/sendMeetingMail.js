const nodemailer = require("nodemailer");

const sendMeetingMail = async (toEmail, type, meetingUrl, otherPersonName, senderEmail, keyPassword = "", scheduledTime = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = "";
    let html = "";
    let fromAddress = `"Interview.io System" <${process.env.EMAIL_USER}>`;

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

    if (type === "invite") {
      subject = "Technical Assessment Scheduled: Join Meeting";
      fromAddress = `"${otherPersonName}" <${senderEmail || process.env.EMAIL_USER}>`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Your Interview has been Scheduled!</h2>
          <p style="color: #475569; font-size: 16px;">
            Your interviewer <strong>${otherPersonName}</strong> has scheduled and confirmed your technical assessment meeting room.
          </p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Scheduled Time:</strong> <span style="color: #4f46e5; font-weight: bold;">${formatTime(scheduledTime)}</span></p>
            ${keyPassword ? `<p style="margin: 10px 0 5px 0;"><strong>Key Password to Enter:</strong> <span style="font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0f172a; font-size: 16px; letter-spacing: 1px;">${keyPassword}</span></p>` : ""}
          </div>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${meetingUrl}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Join Meeting Room
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px;">
            Please ensure you are using a modern browser (Chrome/Firefox), grant microphone/camera permissions when joining, and enter the password when prompted.
          </p>
        </div>
      `;
    } else if (type === "joined") {
      subject = `Candidate ${otherPersonName} Joined the Meeting`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #10b981;">Candidate is Waiting</h2>
          <p style="color: #475569; font-size: 16px;">
            The candidate <strong>${otherPersonName}</strong> has just joined the meeting room.
          </p>
          <div style="margin: 30px 0;">
            <a href="${meetingUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Join Meeting Room
            </a>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: fromAddress,
      replyTo: senderEmail || process.env.EMAIL_USER,
      to: toEmail,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Meeting mail sent:", info.messageId);
  } catch (error) {
    console.error("Error sending meeting mail:", error);
  }
};

module.exports = sendMeetingMail;
