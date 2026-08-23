import json
import os
import smtplib
import urllib.error
import urllib.request
from datetime import date
from email.message import EmailMessage
from html import escape
from typing import Optional

from dotenv import load_dotenv


def _log(message: str) -> None:
    print(message, flush=True)


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name)
    return (value if value not in {None, ""} else default).strip()


def _env_bool(name: str, default: bool) -> bool:
    value = _env(name)
    if not value:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    try:
        return int(_env(name, str(default)))
    except ValueError:
        _log(f"[Email Notification Notice] Invalid {name}; using default {default}.")
        return default


def _http_error_details(error: urllib.error.HTTPError) -> str:
    body = error.read().decode("utf-8", errors="ignore").strip()
    details = f"HTTP {error.code} {error.reason}"
    return f"{details}: {body}" if body else details


def _send_json_request(
    url: str,
    payload: dict,
    headers: dict,
    success_message: str,
) -> None:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        _log(f"{success_message} (Status: {response.status})")


def _send_via_resend(
    api_key: str,
    sender: str,
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
) -> bool:
    payload = {
        "from": sender,
        "to": [recipient],
        "subject": subject,
        "html": html_content,
        "text": text_content,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "VinayakaFundApp/1.0",
    }

    try:
        _send_json_request(
            "https://api.resend.com/emails",
            payload,
            headers,
            f"[Email Notification (Resend HTTPS)] Successfully sent email to {recipient}",
        )
        return True
    except urllib.error.HTTPError as error:
        details = _http_error_details(error)
        _log(f"[Email Notification (Resend HTTPS Error)] Failed sending to {recipient}: {details}")

        resend_test_recipient = (
            _env("RESEND_VERIFIED_TO_EMAIL")
            or _env("RESEND_ACCOUNT_EMAIL")
            or _env("RESEND_TEST_RECIPIENT_EMAIL")
        )
        if error.code == 403 and resend_test_recipient and resend_test_recipient.lower() != recipient.lower():
            _log(
                "[Email Notification (Resend HTTPS)] Retrying with RESEND_VERIFIED_TO_EMAIL "
                f"because resend.dev can only send to the Resend account email: {resend_test_recipient}"
            )
            payload["to"] = [resend_test_recipient]
            try:
                _send_json_request(
                    "https://api.resend.com/emails",
                    payload,
                    headers,
                    "[Email Notification (Resend HTTPS)] Successfully sent email "
                    f"to verified Resend test recipient {resend_test_recipient}",
                )
                return True
            except urllib.error.HTTPError as retry_error:
                retry_details = _http_error_details(retry_error)
                _log(f"[Email Notification (Resend HTTPS Error)] Retry failed: {retry_details}")
        return False
    except Exception as error:
        _log(f"[Email Notification (Resend HTTPS Error)] Failed to send via Resend: {error}")
        return False


def _send_via_brevo(
    api_key: str,
    sender_email: str,
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
) -> bool:
    payload = {
        "sender": {"email": sender_email, "name": "Vinayaka Fund Committee"},
        "to": [{"email": recipient}],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content,
    }
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "User-Agent": "VinayakaFundApp/1.0",
    }

    try:
        _send_json_request(
            "https://api.brevo.com/v3/smtp/email",
            payload,
            headers,
            f"[Email Notification (Brevo HTTPS)] Successfully sent email to {recipient}",
        )
        return True
    except urllib.error.HTTPError as error:
        _log(f"[Email Notification (Brevo HTTPS Error)] Failed to send via Brevo: {_http_error_details(error)}")
        return False
    except Exception as error:
        _log(f"[Email Notification (Brevo HTTPS Error)] Failed to send via Brevo: {error}")
        return False


def _send_via_smtp(
    smtp_server: str,
    smtp_port: int,
    smtp_username: str,
    smtp_password: str,
    message: EmailMessage,
    recipient: str,
) -> bool:
    use_ssl = _env_bool("SMTP_USE_SSL", smtp_port == 465)
    use_tls = _env_bool("SMTP_USE_TLS", not use_ssl and smtp_port != 25)

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        _log(f"[Email Notification SMTP] Successfully sent email to {recipient} via {smtp_server}:{smtp_port}")
        return True
    except Exception as error:
        _log(f"[Email Notification SMTP Error] Failed to send email to {recipient}: {error}")
        return False


def send_donation_notification_email(
    donor_name: str,
    amount: float,
    payment_method: str,
    upi_transaction_id: str,
    donation_date: date,
    student_year: Optional[str] = None,
    show_donor_name: bool = True,
    description: Optional[str] = None,
    target_email: Optional[str] = None,
    fund_name: Optional[str] = None,
    admin_email: Optional[str] = None,
):
    """
    Sends an instant email notification to the fund administrator when a donor submits a donation form.
    Recipient priority:
      1. NOTIFICATION_EMAIL env var (global admin override)
      2. admin_email from fund owner's User record
      3. target_email (legacy / direct override)
      4. Hardcoded fallback
    """
    load_dotenv()

    configured_notification_email = _env("NOTIFICATION_EMAIL")
    smtp_server = _env("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = _env_int("SMTP_PORT", 587)
    smtp_username = _env("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
    sender_email = _env("SENDER_EMAIL") or smtp_username or "noreply@vinayaka.app"

    # Determine the actual recipient in priority order
    recipient = (
        configured_notification_email
        or (admin_email.strip() if admin_email and admin_email.strip() else "")
        or (target_email.strip() if target_email and target_email.strip() else "")
        or "notifications@vinayaka.app"
    )

    fund_label = fund_name or "Vinayaka Fund"
    subject = f"[{fund_label}] New Donation: ₹{amount:,.2f} from {donor_name}"

    safe_donor_name = escape(donor_name)
    safe_payment_method = escape(payment_method)
    safe_transaction_id = escape(upi_transaction_id)
    safe_student_year = escape(student_year or "N/A")
    safe_description = escape(description or "")
    display_status = "Publicly Visible" if show_donor_name else "Anonymous (Masked)"

    text_content = (
        f"New Donation Submission — {fund_label}\n"
        f"Amount: INR {amount:,.2f}\n"
        f"Donor: {donor_name}\n"
        f"Studying Year / Role: {student_year or 'N/A'}\n"
        f"Payment Method: {payment_method}\n"
        f"Transaction / Ref ID: {upi_transaction_id}\n"
        f"Submission Date: {donation_date}\n"
        f"Public Display: {display_status}\n"
        f"Note: {description or 'N/A'}"
    )

    description_row = (
        f'<div class="detail-row"><span class="label">Note:</span>'
        f'<span class="value">{safe_description}</span></div>'
        if description
        else ""
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #f59e0b; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }}
        .title {{ color: #fbbf24; font-size: 20px; font-weight: bold; margin: 0; }}
        .amount-box {{ background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }}
        .amount {{ font-size: 32px; font-weight: 900; color: #34d399; margin: 0; }}
        .detail-row {{ display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #334155; font-size: 14px; }}
        .label {{ color: #94a3b8; font-weight: 600; }}
        .value {{ color: #f8fafc; font-weight: 700; text-align: right; overflow-wrap: anywhere; }}
        .badge {{ background: #059669; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">{fund_label}</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">New Donor Submission Received</p>
        </div>

        <div class="amount-box">
          <p style="color: #cbd5e1; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: bold;">Submitted Amount</p>
          <p class="amount">&#8377;{amount:,.2f}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <div class="detail-row">
            <span class="label">Donor Name:</span>
            <span class="value">{safe_donor_name}</span>
          </div>
          <div class="detail-row">
            <span class="label">Studying Year / Role:</span>
            <span class="value">{safe_student_year}</span>
          </div>
          <div class="detail-row">
            <span class="label">Payment Method:</span>
            <span class="value"><span class="badge">{safe_payment_method}</span></span>
          </div>
          <div class="detail-row">
            <span class="label">Transaction / Ref ID:</span>
            <span class="value" style="font-family: monospace; color: #fbbf24;">{safe_transaction_id}</span>
          </div>
          <div class="detail-row">
            <span class="label">Submission Date:</span>
            <span class="value">{donation_date}</span>
          </div>
          <div class="detail-row">
            <span class="label">Public Display:</span>
            <span class="value">{display_status}</span>
          </div>
          {description_row}
        </div>

        <div class="footer">
          <p>Logged to Admin Verification Queue. Please verify transaction against committee bank statement.</p>
        </div>
      </div>
    </body>
    </html>
    """

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender_email
    message["To"] = recipient
    message.set_content(text_content, charset="utf-8")
    message.add_alternative(html_content, subtype="html", charset="utf-8")

    resend_api_key = _env("RESEND_API_KEY")
    if resend_api_key:
        resend_from = _env("RESEND_FROM_EMAIL", "Vinayaka Committee <onboarding@resend.dev>")
        if _send_via_resend(resend_api_key, resend_from, recipient, subject, html_content, text_content):
            return

    brevo_api_key = _env("BREVO_API_KEY")
    if brevo_api_key:
        if _send_via_brevo(brevo_api_key, sender_email, recipient, subject, html_content, text_content):
            return

    if smtp_username and smtp_password:
        if smtp_port in {25, 465, 587} and os.getenv("RENDER") and not _env_bool("ALLOW_RENDER_SMTP", False):
            _log(
                "[Email Notification Notice] Skipping SMTP fallback because Render free services block "
                "outbound SMTP ports 25, 465, and 587. Use RESEND_API_KEY with a verified domain or BREVO_API_KEY. "
                "Set ALLOW_RENDER_SMTP=true only on a paid Render service where SMTP egress is allowed."
            )
            return
        _send_via_smtp(smtp_server, smtp_port, smtp_username, smtp_password, message, recipient)
        return

    _log(
        f"[Email Notification Notice] Simulated email to {recipient} for [{fund_label}]: "
        f"Donation INR {amount:,.2f} from {donor_name}. "
        "Set RESEND_API_KEY with a verified sender domain or BREVO_API_KEY for Render deployment."
    )
