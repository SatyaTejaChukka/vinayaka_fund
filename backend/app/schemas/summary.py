from pydantic import BaseModel
from typing import Optional
from datetime import date

class PublicFundSummary(BaseModel):
    id: int
    name: str
    year: int
    description: Optional[str]
    target_amount: float
    total_collected: float
    total_spent: float
    pending_expenses: float
    available_balance: float
    committed_balance: float
    collection_percentage: float
    expense_percentage: float
    verified_donations_count: int
    expenses_count: int
    upi_id: str
    upi_name: str
    notification_email: Optional[str] = None
    public_slug: str
    start_date: Optional[date]
    end_date: Optional[date]
    is_active: bool
