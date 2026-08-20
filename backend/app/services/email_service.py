import os
import smtplib
from email.message import EmailMessage
from datetime import date
from typing import Optional
from dotenv import load_dotenv

def send_donation_notification_email(
    donor_name: str,
    amount: float,
    payment_method: str,
    upi_transaction_id: str,
    donation_date: date,
    student_year: Optional[str] = None,
    show_donor_name: bool = True,
    description: Optional[str] = None,
    target_email: Optional[str] = None
):
    """
    Sends an instant email notification to administrator when a donor submits a donation form.
    """
    load_dotenv()
    
    default_notification_email = os.getenv("NOTIFICATION_EMAIL", "323103382011@gvpce.ac.in")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    raw_password = os.getenv("SMTP_PASSWORD", "")
    smtp_password = raw_password.replace(" ", "").strip()
    sender_email = os.getenv("SENDER_EMAIL", "").strip() or smtp_username or "satyateja671@gmail.com"

    recipient = target_email.strip() if target_email and target_email.strip() else default_notification_email
    subject = f"🪔 New Donation Submission: ₹{amount:,.2f} from {donor_name}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #f59e0b; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }}
        .title {{ color: #fbbf24; font-size: 20px; font-weight: bold; margin: 0; }}
        .amount-box {{ background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }}
        .amount {{ font-size: 32px; font-weight: 900; color: #34d399; margin: 0; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; font-size: 14px; }}
        .label {{ color: #94a3b8; font-weight: 600; }}
        .value {{ color: #f8fafc; font-weight: 700; text-align: right; }}
        .badge {{ background: #059669; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-size: 36px; margin-bottom: 8px;">🪔</div>
          <h2 class="title">Vinayaka Chavithi Fund 2026</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">New Donor Submission Received</p>
        </div>

        <div class="amount-box">
          <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: bold;">Submitted Amount</p>
          <p class="amount">₹{amount:,.2f}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <div class="detail-row">
            <span class="label">Donor Name:</span>
            <span class="value">{donor_name}</span>
          </div>
          <div class="detail-row">
            <span class="label">Studying Year / Role:</span>
            <span class="value">{student_year or 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Payment Method:</span>
            <span class="value"><span class="badge">{payment_method}</span></span>
          </div>
          <div class="detail-row">
            <span class="label">Transaction / Ref ID:</span>
            <span class="value" style="font-family: monospace; color: #fbbf24;">{upi_transaction_id}</span>
          </div>
          <div class="detail-row">
            <span class="label">Submission Date:</span>
            <span class="value">{donation_date}</span>
          </div>
          <div class="detail-row">
            <span class="label">Public Display:</span>
            <span class="value">{'Publicly Visible' if show_donor_name else 'Anonymous (Masked)'}</span>
          </div>
          {f'<div class="detail-row"><span class="label">Note:</span><span class="value">{description}</span></div>' if description else ''}
        </div>

        <div class="footer">
          <p>Logged to Admin Verification Queue. Please verify transaction against committee bank statement.</p>
        </div>
      </div>
    </body>
    </html>
    """

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = recipient
    msg.set_content(f"New Donation Submission: ₹{amount:,.2f} from {donor_name}. Ref ID: {upi_transaction_id}", charset='utf-8')
    msg.add_alternative(html_content, subtype='html', charset='utf-8')

    try:
        if smtp_username and smtp_password:
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15) as server:
                    server.login(smtp_username, smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.send_message(msg)
            print(f"[Email Notification] Successfully sent email to {recipient}")
        else:
            print(f"[Email Notification Notice] Simulated email to {recipient}: Donation ₹{amount} from {donor_name}. (Set SMTP_USERNAME & SMTP_PASSWORD in .env for live delivery)")
    except Exception as e:
        print(f"[Email Notification Error] Failed to send email to {recipient}: {e}")
