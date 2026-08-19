from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class Fund(Base):
    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Float, nullable=False, default=100000.0)
    upi_id = Column(String, nullable=False, default="vinayaka@upi")
    upi_name = Column(String, nullable=False, default="Vinayaka Chavithi Committee")
    public_slug = Column(String, unique=True, index=True, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    donations = relationship("Donation", back_populates="fund", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="fund", cascade="all, delete-orphan")
