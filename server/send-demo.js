require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { sendEmail } = require('./utils/emailService');

const sendDemoEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Find the most recently active user or just the first user
    const user = await User.findOne({ email: "sourjyamitra8188@gmail.com" }) || await User.findOne().sort({ updatedAt: -1 });

    if (!user) {
      console.log("No user found in the database.");
      process.exit(1);
    }

    console.log(`Sending demo email to: ${user.name} <${user.email}>`);

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; padding: 40px 20px; text-align: center;">
        
        <div style="max-width: 600px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; padding: 40px 30px; text-align: left; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.05);">
          
          <h2 style="color: #ffffff; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 10px; letter-spacing: -0.02em;">Welcome to Sora</h2>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 30px;">
            Hi <strong style="color: #ffffff;">${user.name}</strong>,<br><br>
            Welcome to the platform where great engineers are made. We built Sora to simulate the actual engineering loop, moving past isolated coding problems and into the pressure of real 1-on-1 interviews.
          </p>

          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background-color: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(16, 185, 129, 0.2);">1. Adaptive AI</span>
            </div>
            <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Warm Up with Story-Driven Practice</h3>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">
              Search for a topic, and our AI will generate a unique scenario just for you. Write your code in our built-in IDE and get instant, FAANG-calibrated feedback on your logic and code quality.
            </p>
          </div>

          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background-color: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(16, 185, 129, 0.2);">2. Verification</span>
            </div>
            <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Complete Your Profile</h3>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">
              Head to your Dashboard and complete your profile. All live interviews require verification to maintain the highest quality of interactions. Once verified, the entire platform unlocks.
            </p>
          </div>

          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background-color: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(16, 185, 129, 0.2);">3. The Main Event</span>
            </div>
            <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Book a Live 1-on-1 Interview</h3>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">
              Raise a ticket and get matched with a verified FAANG engineer. Code in our real-time shared IDE and experience the exact pressure of a real technical loop.
            </p>
          </div>

          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background-color: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(16, 185, 129, 0.2);">4. Review & Grow</span>
            </div>
            <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 10px 0;">Review the Tape</h3>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">
              Every live session is automatically recorded. Review the video to catch your communication mistakes and read the detailed feedback report left by your interviewer.
            </p>
          </div>

          <p style="color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 30px;">
            Are you ready to unlock your engineering potential?
          </p>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://sorabuild.netlify.app/login" style="background-color: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; border: none; box-shadow: 0 0 20px rgba(255,255,255,0.2);">Enter Dashboard &rarr;</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #27272a; margin: 40px 0 20px 0;" />
          
          <p style="color: #71717a; font-size: 12px; text-align: center; margin: 0;">
            We can't wait to see what you build.<br><strong style="color: #a1a1aa;">The Sora Team</strong>
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Welcome to Sora — The ultimate interview preparation platform for engineers",
      html: emailHtml
    });

    console.log("Successfully sent the demo email!");
    process.exit(0);
  } catch (error) {
    console.error("Error running demo script:", error);
    process.exit(1);
  }
};

sendDemoEmail();
