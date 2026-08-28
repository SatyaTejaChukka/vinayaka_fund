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
    public_slug: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True
    is_schedule_published: bool = False
    is_banner_active: bool = False
    banner_headline: Optional[str] = "✨ Festival Schedule & Competitions Announced!"
    banner_message: Optional[str] = "🪔 Maha Ganapati Pooja at 9:00 AM | 🎨 Inter-Batch Rangoli Competition at 2:00 PM"

class FundCreate(FundBase):
    pass

class FundUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    upi_id: Optional[str] = None
    upi_name: Optional[str] = None
    public_slug: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    is_schedule_published: Optional[bool] = None
    is_banner_active: Optional[bool] = None
    banner_headline: Optional[str] = None
    banner_message: Optional[str] = None

class FundResponse(FundBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
