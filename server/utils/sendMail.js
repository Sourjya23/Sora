const nodemailer = require("nodemailer");

const sendMail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4F46E5;">Verification OTP</h2>
          <p>Thank you for registering at interview.io. Your One-Time Password is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background-color: #F3F4F6; display: inline-block; border-radius: 8px; margin: 10px 0; color: #111827;">
            ${otp}
          </div>
          <p style="color: #6B7280; font-size: 14px;">This OTP will expire in 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("OTP sent to", email, "OTP code:", otp);
  } catch (error) {
    console.error("Error sending mail:", error);
  }
};

module.exports = sendMail;
