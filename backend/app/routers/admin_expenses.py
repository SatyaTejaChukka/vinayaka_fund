from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.fund import Fund
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseVoidRequest, AdminExpenseResponse
from app.dependencies.auth import get_current_admin
from app.services.audit_service import log_action

router = APIRouter(tags=["Admin Expenses"])

def get_owned_fund(db: Session, fund_id: int, current_admin: User) -> Fund:
    fund = db.query(Fund).filter(Fund.id == fund_id, Fund.admin_id == current_admin.id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return fund


def get_owned_expense(db: Session, expense_id: int, current_admin: User) -> Expense:
    expense = (
        db.query(Expense)
        .join(Fund, Expense.fund_id == Fund.id)
        .filter(Expense.id == expense_id, Fund.admin_id == current_admin.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


def editable_expense_state(expense: Expense) -> dict:
    return {
        "amount": expense.amount,
        "purpose": expense.purpose,
        "description": expense.description,
        "handled_by": expense.handled_by,
        "expense_date": expense.expense_date.isoformat(),
        "status": expense.status,
        "void_reason": expense.void_reason,
    }

@router.get("/api/admin/funds/{fund_id}/expenses", response_model=List[AdminExpenseResponse])
def list_admin_expenses(
    fund_id: int,
    status: Optional[str] = Query(None, description="Filter by status: PENDING, SPENT, VOIDED"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    get_owned_fund(db, fund_id, current_admin)
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
    get_owned_fund(db, fund_id, current_admin)

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

@router.put("/api/admin/expenses/{expense_id}", response_model=AdminExpenseResponse)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    expense = get_owned_expense(db, expense_id, current_admin)
    old_data = editable_expense_state(expense)
    next_status = expense_in.status.upper()
    next_void_reason = (expense_in.void_reason or "").strip() or None

    if next_status == "VOIDED" and not next_void_reason:
        raise HTTPException(status_code=400, detail="A void reason is required for voided expenses.")

    expense.amount = expense_in.amount
    expense.purpose = expense_in.purpose.strip()
    expense.description = (expense_in.description or "").strip() or None
    expense.handled_by = expense_in.handled_by.strip()
    expense.expense_date = expense_in.expense_date
    expense.status = next_status

    if next_status == "VOIDED":
        expense.voided_at = expense.voided_at or datetime.utcnow()
        expense.voided_by = expense.voided_by or current_admin.id
        expense.void_reason = next_void_reason
    else:
        expense.voided_at = None
        expense.voided_by = None
        expense.void_reason = None

    db.commit()
    db.refresh(expense)

    log_action(
        db,
        action="UPDATE",
        entity_type="EXPENSE",
        entity_id=expense.id,
        user_id=current_admin.id,
        old_data=old_data,
        new_data=editable_expense_state(expense),
    )
    return expense

@router.post("/api/admin/expenses/{expense_id}/mark-spent", response_model=AdminExpenseResponse)
def mark_expense_spent(
    expense_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    expense = get_owned_expense(db, expense_id, current_admin)

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
    expense = get_owned_expense(db, expense_id, current_admin)

    old_status = expense.status
    expense.status = "VOIDED"
    expense.voided_at = datetime.utcnow()
    expense.voided_by = current_admin.id
    expense.void_reason = void_req.reason

    db.commit()
    db.refresh(expense)

    log_action(db, action="VOID", entity_type="EXPENSE", entity_id=expense.id, user_id=current_admin.id, old_data={"status": old_status}, new_data={"status": "VOIDED", "reason": void_req.reason})
    return expense
