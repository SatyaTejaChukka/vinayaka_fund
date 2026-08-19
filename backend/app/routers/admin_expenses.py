from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.fund import Fund
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseVoidRequest, AdminExpenseResponse
from app.dependencies.auth import get_current_admin
from app.services.audit_service import log_action

router = APIRouter(tags=["Admin Expenses"])

@router.get("/api/admin/funds/{fund_id}/expenses", response_model=List[AdminExpenseResponse])
def list_admin_expenses(
    fund_id: int,
    status: Optional[str] = Query(None, description="Filter by status: PENDING, SPENT, VOIDED"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    query = db.query(Expense).filter(Expense.fund_id == fund_id)
    if status:
        query = query.filter(Expense.status == status.upper())
    return query.order_by(Expense.expense_date.desc(), Expense.created_at.desc()).all()

@router.post("/api/admin/funds/{fund_id}/expenses", response_model=AdminExpenseResponse)
def create_expense(
    fund_id: int,
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fund = db.query(Fund).filter(Fund.id == fund_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    expense = Expense(
        fund_id=fund_id,
        amount=expense_in.amount,
        purpose=expense_in.purpose,
        description=expense_in.description,
        handled_by=expense_in.handled_by,
        expense_date=expense_in.expense_date,
        status=expense_in.status
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    log_action(db, action="CREATE", entity_type="EXPENSE", entity_id=expense.id, user_id=current_admin.id, new_data={"purpose": expense.purpose, "amount": expense.amount, "status": expense.status})
    return expense

@router.post("/api/admin/expenses/{expense_id}/mark-spent", response_model=AdminExpenseResponse)
def mark_expense_spent(
    expense_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    old_status = expense.status
    expense.status = "SPENT"

    db.commit()
    db.refresh(expense)

    log_action(db, action="UPDATE_STATUS", entity_type="EXPENSE", entity_id=expense.id, user_id=current_admin.id, old_data={"status": old_status}, new_data={"status": "SPENT"})
    return expense

@router.post("/api/admin/expenses/{expense_id}/void", response_model=AdminExpenseResponse)
def void_expense(
    expense_id: int,
    void_req: ExpenseVoidRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    old_status = expense.status
    expense.status = "VOIDED"
    expense.voided_at = datetime.utcnow()
    expense.voided_by = current_admin.id
    expense.void_reason = void_req.reason

    db.commit()
    db.refresh(expense)

    log_action(db, action="VOID", entity_type="EXPENSE", entity_id=expense.id, user_id=current_admin.id, old_data={"status": old_status}, new_data={"status": "VOIDED", "reason": void_req.reason})
    return expense
