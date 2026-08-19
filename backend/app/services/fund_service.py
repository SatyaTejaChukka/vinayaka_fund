from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.fund import Fund
from app.models.donation import Donation
from app.models.expense import Expense
from app.schemas.summary import PublicFundSummary

def calculate_fund_summary(db: Session, fund: Fund) -> PublicFundSummary:
    # Verified donations sum
    total_collected_res = db.query(func.sum(Donation.amount)).filter(
        Donation.fund_id == fund.id,
        Donation.status == "VERIFIED"
    ).scalar()
    total_collected = float(total_collected_res) if total_collected_res else 0.0

    # Spent expenses sum
    total_spent_res = db.query(func.sum(Expense.amount)).filter(
        Expense.fund_id == fund.id,
        Expense.status == "SPENT"
    ).scalar()
    total_spent = float(total_spent_res) if total_spent_res else 0.0

    # Pending expenses sum
    pending_expenses_res = db.query(func.sum(Expense.amount)).filter(
        Expense.fund_id == fund.id,
        Expense.status == "PENDING"
    ).scalar()
    pending_expenses = float(pending_expenses_res) if pending_expenses_res else 0.0

    # Count of verified donations
    verified_donations_count = db.query(Donation).filter(
        Donation.fund_id == fund.id,
        Donation.status == "VERIFIED"
    ).count()

    # Count of active expenses (SPENT & PENDING)
    expenses_count = db.query(Expense).filter(
        Expense.fund_id == fund.id,
        Expense.status.in_(["SPENT", "PENDING"])
    ).count()

    available_balance = total_collected - total_spent
    committed_balance = total_collected - total_spent - pending_expenses

    target = fund.target_amount if fund.target_amount > 0 else 1.0
    collection_percentage = min(100.0, round((total_collected / target) * 100.0, 2))
    
    expense_percentage = 0.0
    if total_collected > 0:
        expense_percentage = round((total_spent / total_collected) * 100.0, 2)

    return PublicFundSummary(
        id=fund.id,
        name=fund.name,
        year=fund.year,
        description=fund.description,
        target_amount=fund.target_amount,
        total_collected=total_collected,
        total_spent=total_spent,
        pending_expenses=pending_expenses,
        available_balance=available_balance,
        committed_balance=committed_balance,
        collection_percentage=collection_percentage,
        expense_percentage=expense_percentage,
        verified_donations_count=verified_donations_count,
        expenses_count=expenses_count,
        upi_id=fund.upi_id,
        upi_name=fund.upi_name,
        public_slug=fund.public_slug,
        start_date=fund.start_date,
        end_date=fund.end_date,
        is_active=fund.is_active
    )
