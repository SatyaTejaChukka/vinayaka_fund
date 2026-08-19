from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    purpose: str
    description: Optional[str] = None
    handled_by: str
    expense_date: date
    status: str = "SPENT"  # SPENT or PENDING

class ExpenseVoidRequest(BaseModel):
    reason: str

class PublicExpenseResponse(BaseModel):
    id: int
    amount: float
    purpose: str
    description: Optional[str]
    handled_by: str
    expense_date: date
    status: str

    class Config:
        from_attributes = True

class AdminExpenseResponse(BaseModel):
    id: int
    fund_id: int
    amount: float
    purpose: str
    description: Optional[str]
    handled_by: str
    expense_date: date
    status: str
    created_at: datetime
    updated_at: datetime
    voided_at: Optional[datetime]
    voided_by: Optional[int]
    void_reason: Optional[str]

    class Config:
        from_attributes = True
