const nodemailer = require("nodemailer");

const sendNotificationMail = async (interviewerEmail, candidateName, candidateEmail, jobId, jobDescription, slotStart, slotEnd, resumeUrl) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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

    const mailOptions = {
      from: `"Interview.io System" <${process.env.EMAIL_USER}>`,
      to: interviewerEmail,
      subject: `New Interview Requested: ${candidateName} for ${jobId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5;">New Interview Request</h2>
          <p style="color: #475569; font-size: 16px;">
            A candidate has raised an interview ticket and proposed a custom slot.
          </p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Candidate:</strong> ${candidateName} (${candidateEmail})</p>
            <p style="margin: 5px 0;"><strong>Job ID:</strong> ${jobId}</p>
            <p style="margin: 5px 0;"><strong>Proposed Time Slot:</strong></p>
            <p style="margin: 5px 0; padding-left: 15px; color: #8b5cf6; font-weight: bold;">
              Start: ${formatSlot(slotStart)}<br/>
              End: ${formatSlot(slotEnd)}
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="margin-bottom: 5px; color: #334155;">Job Description (JD):</h4>
            <p style="color: #64748b; font-size: 14px; background-color: #ffffff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; white-space: pre-wrap;">${jobDescription}</p>
          </div>

          ${resumeUrl ? `
          <div style="margin: 20px 0;">
            <a href="${resumeUrl}" target="_blank" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
              View Candidate Resume
            </a>
          </div>
          ` : ""}

          <p style="color: #94a3b8; font-size: 13px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            Log in to the dashboard to confirm and lock this interview schedule. Once scheduled, the assessment will be locked.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Interviewer notification mail sent to:", interviewerEmail, info.messageId);
  } catch (error) {
    console.error("Error sending interviewer notification mail:", error);
  }
};

module.exports = sendNotificationMail;
