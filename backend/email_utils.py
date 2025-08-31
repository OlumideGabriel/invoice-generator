import os
import uuid
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

def generate_verification_token():
    """Generate a unique verification token."""
    return str(uuid.uuid4())

def send_verification_email(recipient_email: str, token: str, first_name: str = None):
    """
    Send a verification email to the user with a verification link.
    
    Args:
        recipient_email (str): The email address of the recipient
        token (str): The verification token
        first_name (str, optional): The recipient's first name for personalization
    """
    if not os.getenv('SENDGRID_API_KEY'):
        raise ValueError("SENDGRID_API_KEY environment variable is not set")
    
    verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={token}"
    
    # Email content
    subject = "Verify your email address"
    greeting = f"Hi {first_name}," if first_name else "Hello,"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body>
        <p>{greeting}</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <p>
            <a href="{verification_url}" style="
                background-color: #10B981;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 4px;
                display: inline-block;
                margin: 10px 0;
            ">Verify Email</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="{verification_url}">{verification_url}</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>Invoice Generator Team</p>
    </body>
    </html>
    """
    
    text_content = f"""
    {greeting}
    
    Thank you for signing up! Please verify your email address by visiting the following link:
    
    {verification_url}
    
    If you didn't create an account, you can safely ignore this email.
    
    Best regards,
    Invoice Generator Team
    """
    
    # Create and send email
    message = Mail(
        from_email=os.getenv('SENDGRID_FROM_EMAIL', 'noreply@invoicegenerator.com'),
        to_emails=recipient_email,
        subject=subject,
        html_content=html_content,
        plain_text_content=text_content
    )
    
    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        return response.status_code == 202  # 202 means accepted for delivery
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def is_verification_token_expired(sent_at: datetime) -> bool:
    """Check if a verification token has expired (24 hours)."""
    if not sent_at:
        return True
    return datetime.utcnow() > sent_at + timedelta(hours=24)
