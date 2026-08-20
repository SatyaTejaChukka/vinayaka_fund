from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)
    donor_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    donation_date = Column(Date, nullable=False, default=datetime.utcnow().date)
    payment_method = Column(String, default="UPI", nullable=False)
    upi_transaction_id = Column(String, nullable=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="PENDING", nullable=False, index=True)  # PENDING, VERIFIED, REJECTED, VOIDED
    show_donor_name = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    void_reason = Column(String, nullable=True)

    student_year = Column(String, nullable=True)  # e.g., "1st Year (I)", "2nd Year (II)", "3rd Year (III)", "4th Year (IV)", "Faculty / Other"
    fund = relationship("Fund", back_populates="donations")
    verifier = relationship("User", foreign_keys=[verified_by])
