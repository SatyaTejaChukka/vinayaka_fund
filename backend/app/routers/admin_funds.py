from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.fund import Fund
from app.models.user import User
from app.schemas.fund import FundCreate, FundUpdate, FundResponse
from app.dependencies.auth import get_current_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/admin/funds", tags=["Admin Funds"])

@router.get("", response_model=List[FundResponse])
def list_funds(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return db.query(Fund).order_by(Fund.created_at.desc()).all()

@router.post("", response_model=FundResponse)
def create_fund(fund_in: FundCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    existing = db.query(Fund).filter(Fund.public_slug == fund_in.public_slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Public slug already exists")

    fund = Fund(**fund_in.model_dump())
    db.add(fund)
    db.commit()
    db.refresh(fund)

    log_action(db, action="CREATE", entity_type="FUND", entity_id=fund.id, user_id=current_admin.id, new_data=fund_in.model_dump())
    return fund

@router.get("/{fund_id}", response_model=FundResponse)
def get_fund(fund_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return fund

from app.models.donation import Donation
from app.models.expense import Expense

@router.put("/{fund_id}", response_model=FundResponse)
def update_fund(fund_id: int, fund_in: FundUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    old_data = {"name": fund.name, "target_amount": fund.target_amount, "upi_id": fund.upi_id, "upi_name": fund.upi_name}
    
    update_data = fund_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(fund, key, value)

    db.commit()
    db.refresh(fund)

    log_action(db, action="UPDATE", entity_type="FUND", entity_id=fund.id, user_id=current_admin.id, old_data=old_data, new_data=update_data)
    return fund

@router.post("/{fund_id}/clear-test-data")
def clear_fund_test_data(fund_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    donations_deleted = db.query(Donation).filter(Donation.fund_id == fund_id).delete()
    expenses_deleted = db.query(Expense).filter(Expense.fund_id == fund_id).delete()
    db.commit()

    log_action(
        db, 
        action="RESET", 
        entity_type="FUND_DATA", 
        entity_id=fund.id, 
        user_id=current_admin.id, 
        new_data={"donations_deleted": donations_deleted, "expenses_deleted": expenses_deleted}
    )

    return {
        "message": f"Successfully deleted {donations_deleted} donations and {expenses_deleted} expenses.",
        "donations_deleted": donations_deleted,
        "expenses_deleted": expenses_deleted
    }
