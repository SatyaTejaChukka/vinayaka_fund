from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.fund import Fund
from app.models.event_schedule import EventSchedule
from app.models.user import User
from app.schemas.event_schedule import (
    EventScheduleCreate,
    EventScheduleUpdate,
    EventScheduleResponse,
    SchedulePublishUpdate,
    BannerPublishUpdate
)
from app.dependencies.auth import get_current_admin
from app.services.audit_service import log_action

router = APIRouter(tags=["Admin Event Schedules"])


def get_owned_fund(db: Session, fund_id: int, current_admin: User) -> Fund:
    fund = db.query(Fund).filter(Fund.id == fund_id, Fund.admin_id == current_admin.id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return fund


def get_owned_schedule(db: Session, schedule_id: int, current_admin: User) -> EventSchedule:
    schedule = (
        db.query(EventSchedule)
        .join(Fund, EventSchedule.fund_id == Fund.id)
        .filter(EventSchedule.id == schedule_id, Fund.admin_id == current_admin.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    return schedule


@router.get("/api/admin/funds/{fund_id}/schedules", response_model=List[EventScheduleResponse])
def list_fund_schedules(
    fund_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    get_owned_fund(db, fund_id, current_admin)
    return (
        db.query(EventSchedule)
        .filter(EventSchedule.fund_id == fund_id)
        .order_by(EventSchedule.order_index.asc(), EventSchedule.event_date.asc(), EventSchedule.created_at.asc())
        .all()
    )


@router.post("/api/admin/funds/{fund_id}/schedules", response_model=EventScheduleResponse)
def create_schedule_item(
    fund_id: int,
    item_in: EventScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    get_owned_fund(db, fund_id, current_admin)

    new_item = EventSchedule(
        fund_id=fund_id,
        title=item_in.title,
        category=item_in.category.upper(),
        event_date=item_in.event_date,
        start_time=item_in.start_time,
        end_time=item_in.end_time,
        venue=item_in.venue,
        description=item_in.description,
        is_highlighted=item_in.is_highlighted,
        order_index=item_in.order_index,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    log_action(
        db,
        action="CREATE",
        entity_type="EVENT_SCHEDULE",
        entity_id=new_item.id,
        user_id=current_admin.id,
        new_data={"title": new_item.title, "category": new_item.category, "venue": new_item.venue}
    )
    return new_item


@router.put("/api/admin/schedules/{schedule_id}", response_model=EventScheduleResponse)
def update_schedule_item(
    schedule_id: int,
    item_in: EventScheduleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    schedule = get_owned_schedule(db, schedule_id, current_admin)

    old_data = {
        "title": schedule.title,
        "category": schedule.category,
        "event_date": schedule.event_date,
        "venue": schedule.venue
    }

    update_data = item_in.model_dump(exclude_unset=True)
    if "category" in update_data and update_data["category"]:
        update_data["category"] = update_data["category"].upper()

    for key, value in update_data.items():
        setattr(schedule, key, value)

    db.commit()
    db.refresh(schedule)

    log_action(
        db,
        action="UPDATE",
        entity_type="EVENT_SCHEDULE",
        entity_id=schedule.id,
        user_id=current_admin.id,
        old_data=old_data,
        new_data=update_data
    )
    return schedule


@router.delete("/api/admin/schedules/{schedule_id}")
def delete_schedule_item(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    schedule = get_owned_schedule(db, schedule_id, current_admin)
    deleted_id = schedule.id
    title = schedule.title

    db.delete(schedule)
    db.commit()

    log_action(
        db,
        action="DELETE",
        entity_type="EVENT_SCHEDULE",
        entity_id=deleted_id,
        user_id=current_admin.id,
        old_data={"title": title}
    )
    return {"message": f"Schedule event '{title}' deleted successfully", "id": deleted_id}


@router.patch("/api/admin/funds/{fund_id}/schedules/publish")
def toggle_schedule_publish(
    fund_id: int,
    publish_in: SchedulePublishUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fund = get_owned_fund(db, fund_id, current_admin)
    old_state = fund.is_schedule_published
    fund.is_schedule_published = publish_in.is_schedule_published
    db.commit()
    db.refresh(fund)

    log_action(
        db,
        action="TOGGLE_SCHEDULE_PUBLISH",
        entity_type="FUND",
        entity_id=fund.id,
        user_id=current_admin.id,
        old_data={"is_schedule_published": old_state},
        new_data={"is_schedule_published": fund.is_schedule_published}
    )
    return {
        "message": "Schedule publish status updated",
        "is_schedule_published": fund.is_schedule_published
    }


@router.patch("/api/admin/funds/{fund_id}/banner/publish")
def toggle_banner_publish(
    fund_id: int,
    banner_in: BannerPublishUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fund = get_owned_fund(db, fund_id, current_admin)
    old_state = fund.is_banner_active
    fund.is_banner_active = banner_in.is_banner_active
    if banner_in.banner_headline is not None:
        fund.banner_headline = banner_in.banner_headline
    if banner_in.banner_message is not None:
        fund.banner_message = banner_in.banner_message

    db.commit()
    db.refresh(fund)

    log_action(
        db,
        action="TOGGLE_BANNER_PUBLISH",
        entity_type="FUND",
        entity_id=fund.id,
        user_id=current_admin.id,
        old_data={"is_banner_active": old_state},
        new_data={
            "is_banner_active": fund.is_banner_active,
            "banner_headline": fund.banner_headline,
            "banner_message": fund.banner_message
        }
    )
    return {
        "message": "Banner status updated",
        "is_banner_active": fund.is_banner_active,
        "banner_headline": fund.banner_headline,
        "banner_message": fund.banner_message
    }


@router.post("/api/admin/funds/{fund_id}/schedules/seed-defaults", response_model=List[EventScheduleResponse])
def seed_default_schedules(
    fund_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fund = get_owned_fund(db, fund_id, current_admin)

    # If events already exist, don't overwrite
    existing_count = db.query(EventSchedule).filter(EventSchedule.fund_id == fund_id).count()
    if existing_count > 0:
        return (
            db.query(EventSchedule)
            .filter(EventSchedule.fund_id == fund_id)
            .order_by(EventSchedule.order_index.asc())
            .all()
        )

    default_events = [
        EventSchedule(
            fund_id=fund_id,
            title="Grand Ganesh Sthapana & Maha Ganapati Pooja",
            category="POOJA",
            event_date="Day 1 - Festival Morning",
            start_time="08:30 AM",
            end_time="11:30 AM",
            venue="Main Campus Quadrangle / Mandapam",
            description="Traditional Vedic rituals, Ganapati Atharvashirsha chanting, and first Maha Mangala Aarti with devotees.",
            is_highlighted=True,
            order_index=1
        ),
        EventSchedule(
            fund_id=fund_id,
            title="Inter-Batch Festive Rangoli Competition",
            category="RANGOLI",
            event_date="Day 2 - Afternoon",
            start_time="02:00 PM",
            end_time="05:00 PM",
            venue="College Central Arena / Entrance Hallway",
            description="Theme: 'Vibrant Vinayaka & Eco Heritage'. Open to all student batches and faculty. Exciting mementos & certificates for top 3 teams!",
            is_highlighted=True,
            order_index=2
        ),
        EventSchedule(
            fund_id=fund_id,
            title="Daily Evening Maha Aarti & Bhajan Sandhya",
            category="POOJA",
            event_date="Every Evening",
            start_time="06:30 PM",
            end_time="07:30 PM",
            venue="Celebration Mandapam",
            description="Devotional hymns, student bhajans, and evening Mangala Aarti.",
            is_highlighted=False,
            order_index=3
        ),
        EventSchedule(
            fund_id=fund_id,
            title="Maha Prasadam & Anna Daanam Distribution",
            category="PRASADAM",
            event_date="Day 3 - Noon",
            start_time="12:30 PM",
            end_time="03:00 PM",
            venue="Dining Pavilion / Mandapam Counters",
            description="Sacred festive prasadam distribution for all students, faculty, staff, and devotees.",
            is_highlighted=False,
            order_index=4
        ),
        EventSchedule(
            fund_id=fund_id,
            title="Ganesh Nimajjanam & Grand Visarjan Procession",
            category="VISARJAN",
            event_date="Final Day - Afternoon",
            start_time="03:30 PM",
            end_time="08:00 PM",
            venue="Campus Ground to Immersion Point",
            description="Grand cultural procession with traditional dhol-tasha, floral showers, and ecofriendly idol immersion.",
            is_highlighted=True,
            order_index=5
        )
    ]

    for item in default_events:
        db.add(item)
    db.commit()

    log_action(
        db,
        action="SEED_DEFAULTS",
        entity_type="EVENT_SCHEDULE",
        entity_id=fund.id,
        user_id=current_admin.id,
        new_data={"seeded_count": len(default_events)}
    )

    return (
        db.query(EventSchedule)
        .filter(EventSchedule.fund_id == fund_id)
        .order_by(EventSchedule.order_index.asc())
        .all()
    )
