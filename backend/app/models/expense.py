from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    purpose = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    handled_by = Column(String, nullable=False)
    expense_date = Column(Date, nullable=False, default=datetime.utcnow().date)
    status = Column(String, default="SPENT", nullable=False, index=True)  # PENDING, SPENT, VOIDED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    voided_at = Column(DateTime, nullable=True)
    voided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    void_reason = Column(String, nullable=True)

    fund = relationship("Fund", back_populates="expenses")
    voider = relationship("User", foreign_keys=[voided_by])
