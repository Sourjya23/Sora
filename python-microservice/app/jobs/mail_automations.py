import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from app.database import db

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_email_sync(to_email: str, subject: str, html_content: str):
    """Synchronous SMTP email sender."""
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠️ Email credentials not set. Skipping email send.")
        return

    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = f"Sora Team <{EMAIL_USER}>"
    msg['To'] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        print(f"📧 Successfully sent email to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")

async def run_upcoming_interview_reminders():
    """Job to send reminders for interviews happening tomorrow."""
    print("⏳ Running Upcoming Interview Reminders...")
    try:
        tomorrow_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        tomorrow_end = tomorrow_start + timedelta(days=1)

        # Get Database collection
        database = db.client.get_default_database()
        meetings_collection = database.get_collection('meetings')
        users_collection = database.get_collection('users')

        # Find meetings scheduled for tomorrow
        cursor = meetings_collection.find({
            "status": "scheduled",
            "scheduledTime": {"$gte": tomorrow_start, "$lt": tomorrow_end}
        })
        meetings = await cursor.to_list(length=100)

        for meeting in meetings:
            candidate_id = meeting.get('candidateId')
            interviewer_id = meeting.get('interviewerId')
            scheduled_time = meeting.get('scheduledTime')
            meeting_id = meeting.get('meetingId')
            key_password = meeting.get('keyPassword')

            if candidate_id:
                candidate = await users_collection.find_one({"_id": candidate_id})
                if candidate and candidate.get('email'):
                    send_email_sync(
                        to_email=candidate['email'],
                        subject="Reminder: Upcoming Technical Interview on Sora",
                        html_content=f"<p>Hello {candidate.get('name', 'Candidate')},</p><p>You have an interview scheduled for {scheduled_time}.</p><p>Meeting ID: {meeting_id}</p><p>Key Password: {key_password}</p>"
                    )
            
            if interviewer_id:
                interviewer = await users_collection.find_one({"_id": interviewer_id})
                if interviewer and interviewer.get('email'):
                    send_email_sync(
                        to_email=interviewer['email'],
                        subject="Reminder: Upcoming Technical Evaluation on Sora",
                        html_content=f"<p>Hello {interviewer.get('name', 'Interviewer')},</p><p>You are scheduled to conduct an interview at {scheduled_time}.</p><p>Meeting ID: {meeting_id}</p><p>Key Password: {key_password}</p>"
                    )
                    
        if meetings:
            print(f"✅ Sent reminders for {len(meetings)} upcoming meetings.")
    except Exception as e:
        print(f"Error in Interview Reminder Job: {e}")

async def run_admin_pending_profiles_digest():
    """Job to send a digest of pending profiles to admins."""
    print("⏳ Running Admin Pending Profiles Digest...")
    try:
        database = db.client.get_default_database()
        users_collection = database.get_collection('users')

        pending_count = await users_collection.count_documents({"profileStatus": "pending"})
        if pending_count > 0:
            send_email_sync(
                to_email="teamsora23@gmail.com",
                subject="Action Required: Pending Profiles on Sora",
                html_content=f"<p>Hello Admin,</p><p>There are currently {pending_count} candidate profiles waiting for verification on the platform.</p>"
            )
            print(f"✅ Sent admin digest for {pending_count} pending profiles.")
    except Exception as e:
        print(f"Error in Admin Digest Job: {e}")
