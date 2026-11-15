const { sendEmail } = require("./emailService");

const sendStatusMail = async (email, status, notes, adminEmail) => {
  try {
    const isApproved = status === "approved";
    const statusText = isApproved ? "Approved" : "Rejected";
    const subjectPrefix = isApproved ? "🎉 Congratulations!" : "Profile Update:";
    const frontendUrl = process.env.FRONTEND_URL || "https://sorabuild.netlify.app";

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; background-color: #041826; color: #e2e8f0; border-radius: 16px;">
        <div style="background-color: ${isApproved ? "#064e3b" : "#4c0519"}; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isApproved ? "You're Verified on Sora! 🚀" : "Verification Status: " + statusText}
          </h1>
        </div>
        
        <div style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          <p>Hello,</p>
          
          ${
            isApproved
              ? `<p>The team at Sora has reviewed and verified your profile. You now have full access to schedule live 1-on-1 interview loops with mentors.</p>`
              : `<p>Your profile verification status has been updated to: <strong style="color: #f43f5e;">${statusText}</strong>.</p>`
          }

          ${
            notes
              ? `
            <div style="margin: 24px 0; padding: 16px; background-color: #07243a; border-left: 4px solid #38bdf8; border-radius: 0 8px 8px 0;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">Reviewer's Note</p>
              <p style="margin: 0; color: #e2e8f0; font-size: 14px; line-height: 1.5;">${notes}</p>
            </div>
          `
              : ""
          }
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${frontendUrl}/login" style="display: inline-block; background-color: #ffffff; color: #041826; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px;">
              Go to Sora Dashboard &rarr;
            </a>
          </div>
          
          <p style="font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px;">
            With 💛 from Team Sora
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `${subjectPrefix} Profile ${statusText} - Sora`,
      html: htmlContent,
      replyTo: adminEmail || undefined,
    });

    console.log(`[sendStatusMail] Status email sent to ${email}: ${status}`);
  } catch (error) {
    console.error("[sendStatusMail] Error sending status mail:", error);
  }
};

module.exports = sendStatusMail;
