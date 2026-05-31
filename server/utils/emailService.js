const { Resend } = require('resend');

// Initialize Resend with the API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`[Resend] Attempting to send email to ${to}...`);
    
    const data = await resend.emails.send({
      from: 'Sora Platform <onboarding@resend.dev>', // Default testing domain
      to,
      subject,
      html,
    });

    console.log('Email sent successfully via Resend:', data.id);
    return data;
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    throw new Error('Failed to send email via Resend API');
  }
};

module.exports = {
  sendEmail,
};
