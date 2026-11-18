const { sendEmail } = require("./emailService");
const { templateInterviewerInvitation, FRONTEND_URL } = require("./emailTemplates");

const sendNotificationMail = async (
  interviewerEmail,
  candidateName,
  candidateEmail,
  jobId,
  jobDescription,
  slotStart,
  slotEnd,
  resumeUrl,
  interviewerName = "Interviewer"
) => {
  try {
    const startObj = new Date(slotStart);
    const proposedDate = startObj.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const proposedTime = startObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const template = templateInterviewerInvitation({
      interviewerName,
      interviewerEmail,
      candidateName,
      candidateEmail,
      position: jobId,
      referenceId: jobId,
      proposedDate,
      proposedTime,
      duration: "45 - 60 minutes",
      timezone: "IST (UTC+5:30)",
      confirmUrl: `${FRONTEND_URL}/interviewer-dashboard`,
      declineUrl: `${FRONTEND_URL}/interviewer-dashboard`,
    });

    await sendEmail({
      to: interviewerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: `"Sora HR & Operations Team" <${template.from}>`,
      replyTo: candidateEmail || undefined,
    });

    console.log("[sendNotificationMail] Template 3 (Interviewer Invitation) sent to:", interviewerEmail);
  } catch (error) {
    console.error("[sendNotificationMail] Error sending notification mail:", error);
  }
};

module.exports = sendNotificationMail;
