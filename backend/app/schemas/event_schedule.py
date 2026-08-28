from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EventScheduleBase(BaseModel):
    title: str
    category: str = "POOJA"  # POOJA, RANGOLI, COMPETITION, CULTURAL, PRASADAM, VISARJAN, OTHER
    event_date: str
    start_time: str
    end_time: Optional[str] = None
    venue: str
    description: Optional[str] = None
    is_highlighted: bool = False
    order_index: int = 0

class EventScheduleCreate(EventScheduleBase):
    pass

class EventScheduleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    event_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    is_highlighted: Optional[bool] = None
    order_index: Optional[int] = None

class EventScheduleResponse(EventScheduleBase):
    id: int
    fund_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SchedulePublishUpdate(BaseModel):
    is_schedule_published: bool

class BannerPublishUpdate(BaseModel):
    is_banner_active: bool
    banner_headline: Optional[str] = None
    banner_message: Optional[str] = None

class PublicScheduleResponse(BaseModel):
    is_schedule_published: bool
    is_banner_active: bool
    banner_headline: Optional[str] = None
    banner_message: Optional[str] = None
    events: List[EventScheduleResponse] = []
