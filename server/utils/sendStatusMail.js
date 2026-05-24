const nodemailer = require("nodemailer");

const sendStatusMail = async (email, status, notes, adminEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const statusColor = status === "approved" ? "#10B981" : "#F43F5E";
    const statusText = status === "approved" ? "Approved" : "Rejected";

    const mailOptions = {
      from: `"Interview.io Team" <${process.env.EMAIL_USER}>`,
      replyTo: adminEmail,
      to: email,
      subject: `Profile Verification Update: ${statusText}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: ${statusColor};">Profile Verification ${statusText}</h2>
          <p>Hello,</p>
          <p>Your profile verification status has been updated to: <strong>${statusText}</strong>.</p>
          ${notes ? `<p><strong>Feedback/Notes:</strong> ${notes}</p>` : ""}
          <p>Log in to your dashboard to see more details.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status email sent to ${email}: ${status}`);
  } catch (error) {
    console.error("Error sending status mail:", error);
  }
};

module.exports = sendStatusMail;
