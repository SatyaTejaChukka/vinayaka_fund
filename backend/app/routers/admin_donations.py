from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.fund import Fund
from app.models.donation import Donation
from app.models.user import User
from app.schemas.donation import DonationAdminCreate, DonationVoidRequest, AdminDonationResponse
from app.dependencies.auth import get_current_admin
from app.services.audit_service import log_action

router = APIRouter(tags=["Admin Donations"])

@router.get("/api/admin/funds/{fund_id}/donations", response_model=List[AdminDonationResponse])
def list_admin_donations(
    fund_id: int,
    status: Optional[str] = Query(None, description="Filter by status: PENDING, VERIFIED, REJECTED, VOIDED"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    query = db.query(Donation).filter(Donation.fund_id == fund_id)
    if status:
        query = query.filter(Donation.status == status.upper())
    return query.order_by(Donation.created_at.desc()).all()

@router.post("/api/admin/funds/{fund_id}/donations", response_model=AdminDonationResponse)
def create_manual_donation(
    fund_id: int,
    donation_in: DonationAdminCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    donation = Donation(
        fund_id=fund_id,
        donor_name=donation_in.donor_name,
        amount=donation_in.amount,
        donation_date=donation_in.donation_date,
        payment_method="UPI",
        upi_transaction_id=donation_in.upi_transaction_id,
        description=donation_in.description,
        status=donation_in.status,
        show_donor_name=donation_in.show_donor_name,
        student_year=donation_in.student_year,
        verified_at=datetime.utcnow() if donation_in.status == "VERIFIED" else None,
        verified_by=current_admin.id if donation_in.status == "VERIFIED" else None
    )

    db.add(donation)
    db.commit()
    db.refresh(donation)

    log_action(db, action="CREATE", entity_type="DONATION", entity_id=donation.id, user_id=current_admin.id, new_data={"donor_name": donation.donor_name, "amount": donation.amount, "status": donation.status})
    return donation

@router.post("/api/admin/donations/{donation_id}/verify", response_model=AdminDonationResponse)
def verify_donation(
    donation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    old_status = donation.status
    donation.status = "VERIFIED"
    donation.verified_at = datetime.utcnow()
    donation.verified_by = current_admin.id

    db.commit()
    db.refresh(donation)

    log_action(db, action="VERIFY", entity_type="DONATION", entity_id=donation.id, user_id=current_admin.id, old_data={"status": old_status}, new_data={"status": "VERIFIED"})
    return donation

@router.post("/api/admin/donations/{donation_id}/reject", response_model=AdminDonationResponse)
def reject_donation(
    donation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    old_status = donation.status
    donation.status = "REJECTED"

    db.commit()
    db.refresh(donation)

    log_action(db, action="REJECT", entity_type="DONATION", entity_id=donation.id, user_id=current_admin.id, old_data={"status": old_status}, new_data={"status": "REJECTED"})
    return donation

@router.post("/api/admin/donations/{donation_id}/void", response_model=AdminDonationResponse)
def void_donation(
    donation_id: int,
    void_req: DonationVoidRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    old_status = donation.status
    donation.status = "VOIDED"
    donation.void_reason = void_req.reason

    db.commit()
    db.refresh(donation)

    log_action(db, action="VOID", entity_type="DONATION", entity_id=donation.id, user_id=current_admin.id, old_data={"status": old_status}, new_data={"status": "VOIDED", "reason": void_req.reason})
    return donation
