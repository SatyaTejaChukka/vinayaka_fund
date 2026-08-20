from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class DonationSubmit(BaseModel):
    donor_name: str
    amount: float = Field(..., gt=0)
    donation_date: date
    upi_transaction_id: str
    description: Optional[str] = None
    show_donor_name: bool = True
    student_year: Optional[str] = None  # e.g., "1st Year (I)", "2nd Year (II)", "3rd Year (III)", "4th Year (IV)"

class DonationAdminCreate(DonationSubmit):
    status: str = "VERIFIED"  # Can directly be created as VERIFIED by admin

class DonationVoidRequest(BaseModel):
    reason: str

class PublicDonationResponse(BaseModel):
    id: int
    donor_name: str  # Will be "Anonymous" if show_donor_name is False
    amount: float
    donation_date: date
    status: str
    show_donor_name: bool
    student_year: Optional[str] = None

    class Config:
        from_attributes = True

class AdminDonationResponse(BaseModel):
    id: int
    fund_id: int
    donor_name: str
    amount: float
    donation_date: date
    payment_method: str
    upi_transaction_id: Optional[str]
    description: Optional[str]
    status: str
    show_donor_name: bool
    student_year: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    verified_at: Optional[datetime]
    verified_by: Optional[int]
    void_reason: Optional[str]

    class Config:
        from_attributes = True
