from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/api/admin/audit-logs", tags=["Admin Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
