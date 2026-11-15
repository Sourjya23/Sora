const { sendEmail } = require("./emailService");

const sendMail = async (email, otp) => {
  try {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background-color: #041826; color: #e2e8f0; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0;">Sora Verification OTP</h2>
        <p style="color: #94a3b8; font-size: 15px;">Thank you for registering at Sora. Your One-Time Password is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px 24px; background-color: #07243a; display: inline-block; border-radius: 12px; margin: 16px 0; color: #ffffff; border: 1px solid #0e3d60; font-family: monospace;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP will expire in 5 minutes.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Verification OTP - Sora",
      html,
    });

    console.log("[sendMail] OTP dispatched for", email);
  } catch (error) {
    console.error("[sendMail] Error sending OTP mail:", error);
    // Log clearly but do not crash
  }
};

module.exports = sendMail;
