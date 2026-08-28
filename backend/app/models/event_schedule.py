from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class EventSchedule(Base):
    __tablename__ = "event_schedules"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, default="POOJA")  # POOJA, RANGOLI, CULTURAL, PRASADAM, VISARJAN, OTHER
    event_date = Column(String, nullable=False)  # e.g., "2026-09-07" or formatted date
    start_time = Column(String, nullable=False)  # e.g., "09:00 AM"
    end_time = Column(String, nullable=True)     # e.g., "11:30 AM"
    venue = Column(String, nullable=False)       # e.g., "Main Quadrangle / Campus Arena"
    description = Column(Text, nullable=True)    # e.g., "Inter-batch Rangoli competition. Theme: Ganesha & Nature."
    is_highlighted = Column(Boolean, default=False, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    fund = relationship("Fund", back_populates="event_schedules")
