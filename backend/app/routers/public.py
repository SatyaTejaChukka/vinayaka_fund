import io
import qrcode
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.fund import Fund
from app.models.donation import Donation
from app.models.expense import Expense
from app.schemas.summary import PublicFundSummary
from app.schemas.donation import DonationSubmit, PublicDonationResponse
from app.schemas.expense import PublicExpenseResponse
from app.services.fund_service import calculate_fund_summary
from app.services.email_service import send_donation_notification_email

router = APIRouter(prefix="/api/public/funds", tags=["Public Transparency"])

def get_fund_by_slug(slug: str, db: Session) -> Fund:
    fund = db.query(Fund).filter(Fund.public_slug == slug, Fund.is_active == True).first()
    if not fund:
        # Fallback: try by active fund if single fund exists
        fund = db.query(Fund).filter(Fund.is_active == True).first()
        if not fund:
            raise HTTPException(status_code=404, detail="Fund not found")
    return fund

@router.get("/{slug}", response_model=PublicFundSummary)
def get_public_fund_summary(slug: str, db: Session = Depends(get_db)):
    fund = get_fund_by_slug(slug, db)
    return calculate_fund_summary(db, fund)

@router.get("/{slug}/donations", response_model=List[PublicDonationResponse])
def get_public_verified_donations(slug: str, db: Session = Depends(get_db)):
    fund = get_fund_by_slug(slug, db)
    donations = db.query(Donation).filter(
        Donation.fund_id == fund.id,
        Donation.status == "VERIFIED"
    ).order_by(Donation.donation_date.desc(), Donation.created_at.desc()).all()

    result = []
    for d in donations:
        result.append(PublicDonationResponse(
            id=d.id,
            donor_name=d.donor_name if d.show_donor_name else "Anonymous",
            amount=d.amount,
            donation_date=d.donation_date,
            status=d.status,
            show_donor_name=d.show_donor_name,
            student_year=d.student_year
        ))
    return result

@router.get("/{slug}/expenses", response_model=List[PublicExpenseResponse])
def get_public_expenses(slug: str, db: Session = Depends(get_db)):
    fund = get_fund_by_slug(slug, db)
    expenses = db.query(Expense).filter(
        Expense.fund_id == fund.id,
        Expense.status.in_(["SPENT", "PENDING"])
    ).order_by(Expense.expense_date.desc(), Expense.created_at.desc()).all()

    return expenses

@router.post("/{slug}/donations/submit", response_model=PublicDonationResponse)
def submit_donation(
    slug: str,
    donation_in: DonationSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    fund = get_fund_by_slug(slug, db)

    pm = "CASH" if donation_in.upi_transaction_id and donation_in.upi_transaction_id.startswith("CASH-") else "UPI"
    new_donation = Donation(
        fund_id=fund.id,
        donor_name=donation_in.donor_name,
        amount=donation_in.amount,
        donation_date=donation_in.donation_date,
        payment_method=pm,
        upi_transaction_id=donation_in.upi_transaction_id,
        description=donation_in.description,
        status="PENDING",
        show_donor_name=donation_in.show_donor_name,
        student_year=donation_in.student_year
    )

    db.add(new_donation)
    db.commit()
    db.refresh(new_donation)

    # Queue instant notification email to satyateja671@gmail.com
    background_tasks.add_task(
        send_donation_notification_email,
        donor_name=new_donation.donor_name,
        amount=new_donation.amount,
        payment_method=pm,
        upi_transaction_id=new_donation.upi_transaction_id,
        donation_date=new_donation.donation_date,
        student_year=new_donation.student_year,
        show_donor_name=new_donation.show_donor_name,
        description=new_donation.description
    )

    return PublicDonationResponse(
        id=new_donation.id,
        donor_name=new_donation.donor_name if new_donation.show_donor_name else "Anonymous",
        amount=new_donation.amount,
        donation_date=new_donation.donation_date,
        status=new_donation.status,
        show_donor_name=new_donation.show_donor_name,
        student_year=new_donation.student_year
    )

@router.get("/{slug}/qr")
def generate_upi_qr(slug: str, amount: Optional[float] = None, db: Session = Depends(get_db)):
    fund = get_fund_by_slug(slug, db)
    
    # Standard UPI Payment URI specification
    upi_uri = f"upi://pay?pa={quote(fund.upi_id)}&pn={quote(fund.upi_name)}&cu=INR"
    if amount and amount > 0:
        upi_uri += f"&am={amount:.2f}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(upi_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr)
    img_byte_arr.seek(0)

    return StreamingResponse(img_byte_arr, media_type="image/png")
