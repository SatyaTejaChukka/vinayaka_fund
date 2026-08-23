import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.fund import Fund
from app.models.user import User
from app.schemas.fund import FundCreate, FundUpdate, FundResponse
from app.schemas.summary import PublicFundSummary
from app.dependencies.auth import get_current_admin
from app.services.audit_service import log_action
from app.services.fund_service import calculate_fund_summary

router = APIRouter(prefix="/api/admin/funds", tags=["Admin Funds"])

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def normalize_slug(slug: str) -> str:
    """Normalize and validate a slug string. Raises HTTPException on invalid input."""
    normalized = re.sub(r"[\s_]+", "-", slug.strip().lower())
    normalized = re.sub(r"-+", "-", normalized).strip("-")
    if not normalized or not SLUG_PATTERN.fullmatch(normalized):
        raise HTTPException(
            status_code=400,
            detail="Public slug can only contain lowercase letters, numbers, and single hyphens (e.g. college-fest-2026)"
        )
    if len(normalized) < 3:
        raise HTTPException(status_code=400, detail="Public slug must be at least 3 characters long")
    if len(normalized) > 80:
        raise HTTPException(status_code=400, detail="Public slug must not exceed 80 characters")
    return normalized


def ensure_slug_available(db: Session, public_slug: str, fund_id: int | None = None) -> None:
    """
    Raise 409 if any ACTIVE fund (other than fund_id) already uses this slug.
    Inactive/deactivated funds do not block slug reuse.
    """
    query = db.query(Fund).filter(
        Fund.public_slug == public_slug,
        Fund.is_active == True  # noqa: E712
    )
    if fund_id is not None:
        query = query.filter(Fund.id != fund_id)
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This public slug is already in use by an active fund. Please choose a different slug."
        )


def get_owned_fund(db: Session, fund_id: int, current_admin: User) -> Fund:
    fund = db.query(Fund).filter(Fund.id == fund_id, Fund.admin_id == current_admin.id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return fund


def get_active_fund_for_admin(db: Session, admin_id: int) -> Fund | None:
    """Return the admin's active fund (most recently created active one)."""
    return (
        db.query(Fund)
        .filter(Fund.admin_id == admin_id, Fund.is_active == True)  # noqa: E712
        .order_by(Fund.created_at.desc())
        .first()
    )


# ── Slug availability check (public, no auth needed for UX) ──────────────────

@router.get("/check-slug")
def check_slug_availability(
    slug: str = Query(..., description="Slug to check for availability"),
    fund_id: int | None = Query(None, description="Exclude this fund ID from check (for updates)"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Check whether a slug is available to use. Returns available: true/false."""
    try:
        normalized = normalize_slug(slug)
    except HTTPException as e:
        return {"available": False, "slug": slug, "reason": e.detail}

    query = db.query(Fund).filter(
        Fund.public_slug == normalized,
        Fund.is_active == True  # noqa: E712
    )
    if fund_id is not None:
        query = query.filter(Fund.id != fund_id)

    taken = query.first() is not None
    return {
        "available": not taken,
        "slug": normalized,
        "reason": "Slug is already in use" if taken else None
    }


# ── Fund listing ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[FundResponse])
def list_funds(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return db.query(Fund).filter(Fund.admin_id == current_admin.id).order_by(Fund.created_at.desc()).all()


@router.get("/current", response_model=FundResponse)
def get_current_admin_fund_config(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    """Return the admin's current active fund. Falls back to latest fund if none active."""
    fund = get_active_fund_for_admin(db, current_admin.id)
    if not fund:
        # Fallback: maybe they have an inactive one (just created & not yet activated)
        fund = db.query(Fund).filter(Fund.admin_id == current_admin.id).order_by(Fund.created_at.desc()).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund setup required — please create your fund first")
    return fund


@router.get("/current/summary", response_model=PublicFundSummary)
def get_current_admin_fund_summary(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    fund = get_active_fund_for_admin(db, current_admin.id)
    if not fund:
        fund = db.query(Fund).filter(Fund.admin_id == current_admin.id).order_by(Fund.created_at.desc()).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund setup required")
    return calculate_fund_summary(db, fund)


# ── Fund CRUD ─────────────────────────────────────────────────────────────────

@router.post("", response_model=FundResponse)
def create_fund(fund_in: FundCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    # Only block creation if the admin ALREADY has an ACTIVE fund
    existing_active_fund = get_active_fund_for_admin(db, current_admin.id)
    if existing_active_fund:
        raise HTTPException(
            status_code=400,
            detail="This admin already has an active fund. Deactivate the current fund in Fund Settings before creating a new one."
        )

    fund_data = fund_in.model_dump()
    fund_data["public_slug"] = normalize_slug(fund_data["public_slug"])
    fund_data["admin_id"] = current_admin.id
    ensure_slug_available(db, fund_data["public_slug"])

    fund = Fund(**fund_data)
    db.add(fund)
    db.commit()
    db.refresh(fund)

    log_action(db, action="CREATE", entity_type="FUND", entity_id=fund.id, user_id=current_admin.id, new_data=fund_data)
    return fund


@router.get("/{fund_id}", response_model=FundResponse)
def get_fund(fund_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return get_owned_fund(db, fund_id, current_admin)


from app.models.donation import Donation
from app.models.expense import Expense


@router.put("/{fund_id}", response_model=FundResponse)
def update_fund(fund_id: int, fund_in: FundUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    fund = get_owned_fund(db, fund_id, current_admin)

    old_data = {
        "name": fund.name,
        "target_amount": fund.target_amount,
        "upi_id": fund.upi_id,
        "upi_name": fund.upi_name,
        "public_slug": fund.public_slug
    }

    update_data = fund_in.model_dump(exclude_unset=True)
    if "public_slug" in update_data:
        update_data["public_slug"] = normalize_slug(update_data["public_slug"])
        ensure_slug_available(db, update_data["public_slug"], fund_id=fund.id)

    for key, value in update_data.items():
        setattr(fund, key, value)

    db.commit()
    db.refresh(fund)

    log_action(db, action="UPDATE", entity_type="FUND", entity_id=fund.id, user_id=current_admin.id, old_data=old_data, new_data=update_data)
    return fund


@router.post("/{fund_id}/clear-test-data")
def clear_fund_test_data(fund_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    fund = get_owned_fund(db, fund_id, current_admin)

    donations_deleted = db.query(Donation).filter(Donation.fund_id == fund_id).delete()
    expenses_deleted = db.query(Expense).filter(Expense.fund_id == fund_id).delete()
    db.commit()

    log_action(
        db,
        action="RESET",
        entity_type="FUND_DATA",
        entity_id=fund.id,
        user_id=current_admin.id,
        new_data={"donations_deleted": donations_deleted, "expenses_deleted": expenses_deleted}
    )

    return {
        "message": f"Successfully deleted {donations_deleted} donations and {expenses_deleted} expenses.",
        "donations_deleted": donations_deleted,
        "expenses_deleted": expenses_deleted
    }
