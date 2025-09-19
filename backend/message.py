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
def send_email(to_email, subject, body, from_email="support@envoyce.xyz", content_type="html"):
    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, content_type))  # Use the content_type parameter

        print(f"Preparing to send email to {to_email} via {SMTP_SERVER}:{SMTP_PORT}")

        # Connect & send
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(from_email, to_email, msg.as_string())

        return {"success": True, "message": f"Email sent to {to_email}"}

    except Exception as e:
        return {"success": False, "error": str(e)}
