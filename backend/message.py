import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv


load_dotenv()

SMTP_SERVER = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_USERNAME = os.getenv("SMTP_LOGIN")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# In your messages.py module, modify the function:
def send_email(to_email, subject, issue_type, details, user_name, user_email, user_id=None, from_email="support@envoyce.xyz", content_type="html"):
    try:
        # --- Format ticket-like body ---
        body = f"""
        <h2>New Support Ticket</h2>
        <p><strong>Submitted By:</strong> {user_name} ({user_email})</p>
        {"<p><strong>User ID:</strong> " + str(user_id) + "</p>" if user_id else ""}
        <p><strong>Issue Type:</strong> {issue_type}</p>
        <p><strong>Details:</strong></p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555;">
            {details}
        </blockquote>
        <hr/>
        <p style="font-size: 12px; color: #999;">This ticket was submitted via Envoyce Support Form.</p>
        """

        msg = MIMEMultipart()
        msg["From"] = from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Reply-To"] = user_email  # 👈 reply goes directly to the user
        msg.attach(MIMEText(body, content_type))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(from_email, to_email, msg.as_string())

        return {"success": True, "message": f"Ticket sent to {to_email}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


