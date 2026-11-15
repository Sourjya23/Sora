const { sendEmail } = require("./emailService");

const sendReviewMail = async (toEmail, candidateName, status, interviewerName) => {
  try {
    const isApproved = status === "approved";
    const subject = isApproved
      ? "Offer Letter: Congratulations from Sora!"
      : "Update on your Sora Technical Assessment";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; background-color: #041826; color: #e2e8f0; border-radius: 16px;">
        ${
          isApproved
            ? `
          <h2 style="color: #34d399; margin-top: 0;">Congratulations, ${candidateName}! 🎉</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            We are thrilled to inform you that following your technical assessment with <strong style="color: #ffffff;">${interviewerName}</strong>, your evaluation has been marked as <strong style="color: #34d399;">Selected</strong>!
          </p>
          
          <div style="background-color: #07243a; padding: 18px; border-radius: 12px; margin: 24px 0; border: 1px solid #0e3d60;">
            <p style="margin: 6px 0; color: #cbd5e1;"><strong>Evaluation Result:</strong> <span style="color: #34d399; font-weight: bold;">Selected</span></p>
            <p style="margin: 6px 0; color: #cbd5e1;"><strong>Interview Track:</strong> Software Engineer Technical Assessment</p>
          </div>

          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            The hiring team will reach out with the next formal onboarding steps. Well done!
          </p>
        `
            : `
          <h2 style="color: #e2e8f0; margin-top: 0;">Hello ${candidateName},</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            Thank you for taking the time to complete your technical assessment with <strong style="color: #ffffff;">${interviewerName}</strong> on Sora.
          </p>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            While we appreciated your time and code submission, we have decided not to advance with an offer for this particular cycle.
          </p>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
            We encourage you to continue honing your skills through the Sora practice modules and apply again in the future!
          </p>
        `
        }

        <p style="color: #64748b; font-size: 13px; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px;">
          Best regards,<br/>Team Sora
        </p>
      </div>
    `;

    await sendEmail({
      to: toEmail,
      subject,
      html,
    });

    console.log(`[sendReviewMail] Review email sent to: ${toEmail} (${status})`);
  } catch (error) {
    console.error("[sendReviewMail] Error sending review mail:", error);
  }
};

module.exports = sendReviewMail;
