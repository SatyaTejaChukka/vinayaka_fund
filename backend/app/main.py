from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

load_dotenv()
import os
from alembic.config import Config
from alembic import command
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal, get_db
from app.models import User, Fund
from app.core.security import get_password_hash
from app.routers import auth, public, admin_funds, admin_donations, admin_expenses, admin_audit

def run_db_migrations():
    """Run Alembic migrations programmatically to head revision."""
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        alembic_ini_path = os.path.join(backend_dir, "alembic.ini")
        alembic_cfg = Config(alembic_ini_path)
        
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        alembic_cfg.set_main_option("sqlalchemy.url", db_url)
        
        command.upgrade(alembic_cfg, "head")
        print("Alembic database migrations applied successfully to HEAD.")
    except Exception as e:
        print(f"Warning: Alembic programmatic migration runner notice: {e}")
        # Ensure tables exist as fallback
        Base.metadata.create_all(bind=engine)

# Initialize database schema through Alembic / metadata
run_db_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Vinayaka Chavithi Celebration Fund Transparency System API",
    version="1.0.0"
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_seed():
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                role="ADMIN",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print(f"Created default admin user: {settings.ADMIN_EMAIL}")

        # Only reassign orphaned funds (admin_id IS NULL) to the seed admin.
        # This is a one-time migration guard; new funds always get admin_id on creation.
        orphaned_count = db.execute(text("SELECT COUNT(*) FROM funds WHERE admin_id IS NULL")).scalar()
        if orphaned_count and orphaned_count > 0:
            db.execute(
                text("UPDATE funds SET admin_id = :admin_id WHERE admin_id IS NULL"),
                {"admin_id": admin.id}
            )
            db.commit()
            print(f"Migrated {orphaned_count} orphaned fund(s) to seed admin ({admin.email})")

        # Check if default fund exists
        fund = db.query(Fund).filter(Fund.public_slug == "vinayaka-chavithi-2026").first()
        if not fund:
            fund = Fund(
                name="Vinayaka Chavithi 2026",
                year=2026,
                description="Community Vinayaka Chavithi Celebration Fund Transparency Portal",
                target_amount=100000.0,
                upi_id="vinayaka@example",
                upi_name="Vinayaka Chavithi Committee",
                admin_id=admin.id,
                public_slug="vinayaka-chavithi-2026",
                is_active=True
            )
            db.add(fund)
            db.commit()
            print("Created default fund: Vinayaka Chavithi 2026")
    finally:
        db.close()

# Include Routers
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin_funds.router)
app.include_router(admin_donations.router)
app.include_router(admin_expenses.router)
app.include_router(admin_audit.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Vinayaka Chavithi Fund Transparency API",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
def health_check(db: Session = Depends(get_db)):
    try:
        # Run lightweight SELECT 1 DB ping to keep both API & Database active
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Vinayaka Chavithi API and Database active"
    }
