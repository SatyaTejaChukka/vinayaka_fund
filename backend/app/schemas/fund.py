from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class FundBase(BaseModel):
    name: str
    year: int
    description: Optional[str] = None
    target_amount: float = Field(..., gt=0)
    upi_id: str
    upi_name: str
    notification_email: Optional[str] = None
    public_slug: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True

class FundCreate(FundBase):
    pass

class FundUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    upi_id: Optional[str] = None
    upi_name: Optional[str] = None
    notification_email: Optional[str] = None
    public_slug: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class FundResponse(FundBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
