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

    const isApproved = status === "approved";
    const subjectPrefix = isApproved ? "🎉 Congratulations!" : "Profile Update:";
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: ${isApproved ? '#10B981' : '#F43F5E'}; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">
              ${isApproved ? 'You\'re Verified! 🚀' : 'Verification Status: ' + statusText}
            </h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px; color: #374151; line-height: 1.6; font-size: 16px;">
            <p>Hello there,</p>
            
            ${isApproved 
              ? `<p>We have incredible news! The Founders at Team Sora have personally reviewed your profile and we are thrilled to welcome you to the platform. Your journey to mastering technical interviews starts right here.</p>`
              : `<p>Your profile verification status has been updated to: <strong style="color: #F43F5E;">${statusText}</strong>.</p>`
            }

            ${notes ? `
              <div style="margin: 30px 0; padding: 25px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0;">
                <p style="margin-top: 0; font-size: 13px; font-weight: bold; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">Founder's Note</p>
                <p style="font-family: 'Caveat', cursive; font-size: 26px; color: #92400e; margin-bottom: 0; line-height: 1.3;">
                  "${notes}"
                </p>
              </div>
            ` : ""}
            
            <p style="margin-top: 30px;">
              <a href="http://localhost:5173/login" style="display: inline-block; background: #111827; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                Go to Dashboard
              </a>
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 40px 0 20px;" />
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              With 💛 from Team Sora
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Team Sora" <${process.env.EMAIL_USER}>`,
      replyTo: adminEmail,
      to: email,
      subject: `${subjectPrefix} Profile ${statusText}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Status email sent to ${email}: ${status}`);
  } catch (error) {
    console.error("Error sending status mail:", error);
  }
};

module.exports = sendStatusMail;
