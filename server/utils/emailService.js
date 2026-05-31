const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;

const getGmailService = () => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/oauth2callback"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const gmail = getGmailService();

    // Construct raw email according to RFC 2822
    const message = [
      `From: Sora Platform <${process.env.EMAIL_USER}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      html,
    ].join("\n");

    // Base64url encode the message
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    console.log(`[Gmail API] Attempting to send email to ${to}...`);

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("Email sent successfully via Gmail API:", res.data.id);
    return res.data;
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
    throw new Error("Failed to send email via Gmail API");
  }
};

module.exports = {
  sendEmail,
};
