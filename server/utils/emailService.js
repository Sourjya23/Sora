const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'Sora Platform <onboarding@resend.dev>', // resend.dev is allowed for testing
      to,
      subject,
      html,
    });
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
