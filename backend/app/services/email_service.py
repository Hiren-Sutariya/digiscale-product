import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@digiscale.com")

def send_invite_email(to_email: str, invite_url: str, role: str, inviter_name: str = "A Workspace Owner"):
    """
    Sends an invitation email to a user.
    If SMTP credentials are not configured, it will mock the sending by printing to console.
    """
    subject = f"You have been invited to join Digiscale as a {role}"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #2563eb;">Digiscale Invitation</h2>
            <p>Hello!</p>
            <p><strong>{inviter_name}</strong> has invited you to join their workspace as a <strong>{role}</strong>.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{invite_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Accept Invitation
                </a>
            </div>
            <p style="font-size: 12px; color: #666;">If you have trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; color: #666; word-break: break-all;">{invite_url}</p>
        </div>
      </body>
    </html>
    """

    # If SMTP is configured, send the real email
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart()
            msg['From'] = FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(html_body, 'html'))
            
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            server.quit()
            print(f"✅ Email sent successfully to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Failed to send real email to {to_email}. Error: {e}")
            return False
    else:
        # Mock sending email (useful for local development)
        print("="*60)
        print("📨 MOCK EMAIL SENT (No SMTP config found)")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print("-" * 60)
        print(f"Accept Invitation URL:\n{invite_url}")
        print("="*60)
        return True
