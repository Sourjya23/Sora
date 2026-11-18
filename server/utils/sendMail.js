const { sendEmail } = require("./emailService");
const { templateAccountRegistration } = require("./emailTemplates");

const sendMail = async (email, otp, userName = "Candidate") => {
  try {
    const template = templateAccountRegistration({
      candidateName: userName,
      candidateEmail: email,
      otpCode: otp,
      verificationExpiry: "5 minutes",
    });

    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: `"Sora HR & Operations Team" <${template.from}>`,
    });

    console.log("[sendMail] Template 1 (Account Registration) dispatched for", email);
  } catch (error) {
    console.error("[sendMail] Error sending registration verification mail:", error);
    // Log clearly but do not crash
  }
};

module.exports = sendMail;
