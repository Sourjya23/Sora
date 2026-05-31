const { sendEmail } = require('./emailService');

const sendMail = async (email, otp) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">Sora Verification OTP</h2>
        <p>Thank you for registering at Sora. Your One-Time Password is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #F3F4F6; display: inline-block; border-radius: 8px; margin: 10px 0; color: #111827;">
          ${otp}
        </div>
        <p style="color: #6B7280; font-size: 14px;">This OTP will expire in 5 minutes.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Verification OTP - Sora",
      html
    });

    console.log("OTP sent to", email, "OTP code:", otp);
  } catch (error) {
    console.error("Error sending OTP mail:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = sendMail;
