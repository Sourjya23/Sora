const nodemailer = require("nodemailer");

const sendReviewMail = async (toEmail, candidateName, status, interviewerName) => {
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
    const fromAddress = `"Interview.io System" <${process.env.EMAIL_USER}>`;

    if (status === "approved") {
      subject = "Offer Letter: Congratulations from Interview.io!";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #10b981;">Congratulations, ${candidateName}! 🎉</h2>
          <p style="color: #475569; font-size: 16px;">
            We are thrilled to inform you that following your technical assessment with <strong>${interviewerName}</strong>, you have been selected for the position!
          </p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Position:</strong> Software Engineer</p>
            <p style="margin: 5px 0;"><strong>Package:</strong> $120,000 / year + Equity</p>
            <p style="margin: 5px 0;"><strong>Joining Date:</strong> 1st of Next Month</p>
          </div>

          <p style="color: #475569; font-size: 16px;">
            Our HR team will reach out shortly with the official paperwork. Welcome aboard!
          </p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = "Update on your Interview Application";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #475569;">Hello ${candidateName},</h2>
          <p style="color: #475569; font-size: 16px;">
            Thank you for taking the time to interview with <strong>${interviewerName}</strong>. 
          </p>
          <p style="color: #475569; font-size: 16px;">
            While we were impressed with your background, we have decided to move forward with other candidates whose qualifications more closely match our current needs for this particular role.
          </p>
          <p style="color: #475569; font-size: 16px;">
            We will keep your resume on file for future opportunities. We wish you the best of luck in your job search!
          </p>
          <p style="color: #475569; font-size: 16px;">
            Best regards,<br/>The Interview.io Team
          </p>
        </div>
      `;
    }

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Review mail sent:", info.messageId);
  } catch (error) {
    console.error("Error sending review mail:", error);
  }
};

module.exports = sendReviewMail;
