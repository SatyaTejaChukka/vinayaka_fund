from datetime import date, datetime, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Fund, Donation, Expense, AuditLog

Base.metadata.create_all(bind=engine)

def seed_demo_data():
    db = SessionLocal()
    try:
        print("Seeding demo data...")
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@vinayaka.org").first()
        if not admin:
            admin = User(
                name="Committee Admin",
                email="admin@vinayaka.org",
                password_hash=get_password_hash("admin123"),
                role="ADMIN",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 2. Fund
        fund = db.query(Fund).filter(Fund.public_slug == "vinayaka-chavithi-2026").first()
        if not fund:
            fund = Fund(
                name="Vinayaka Chavithi 2026",
                year=2026,
                description="Annual Community Ganesh Festival Celebration & General Prasadam Fund",
                target_amount=100000.0,
                upi_id="vinayaka@upi",
                upi_name="Vinayaka Chavithi Committee",
                admin_id=admin.id,
                public_slug="vinayaka-chavithi-2026",
                start_date=date(2026, 8, 1),
                end_date=date(2026, 9, 5),
                is_active=True
            )
            db.add(fund)
            db.commit()
            db.refresh(fund)
        elif fund.admin_id is None:
            fund.admin_id = admin.id
            db.commit()
            db.refresh(fund)

        # Clean existing donations & expenses for clean re-seeding
        db.query(Donation).delete()
        db.query(Expense).delete()
        db.query(AuditLog).delete()
        db.commit()

        today = date.today()

        # 3. Sample Verified Donations
        sample_donations = [
            {"donor_name": "Ravi Kumar", "amount": 5000.0, "days": 5, "upi": "UPI98421042", "desc": "Grand Puja Sponsor", "show": True, "status": "VERIFIED"},
            {"donor_name": "Suresh & Family", "amount": 10000.0, "days": 4, "upi": "UPI77812903", "desc": "Laddu Prasadam Contribution", "show": True, "status": "VERIFIED"},
            {"donor_name": "Ananya Sharma", "amount": 2500.0, "days": 4, "upi": "UPI55192834", "desc": "Flower Garland Offering", "show": True, "status": "VERIFIED"},
            {"donor_name": "Venkat Raman", "amount": 15000.0, "days": 3, "upi": "UPI10928347", "desc": "Idol Sponsoring", "show": True, "status": "VERIFIED"},
            {"donor_name": "K. Rajesh", "amount": 5000.0, "days": 3, "upi": "UPI44920193", "desc": "Evening Annadanam", "show": True, "status": "VERIFIED"},
            {"donor_name": "Anonymous Donor", "amount": 2000.0, "days": 2, "upi": "UPI88102938", "desc": "Devotional offering", "show": False, "status": "VERIFIED"},
            {"donor_name": "M. Srinivas", "amount": 8000.0, "days": 2, "upi": "UPI66719283", "desc": "Lighting Decor", "show": True, "status": "VERIFIED"},
            {"donor_name": "Deepak Patel", "amount": 1000.0, "days": 1, "upi": "UPI33019284", "desc": "Festival Blessings", "show": True, "status": "VERIFIED"},
            {"donor_name": "Pooja Reddy", "amount": 5000.0, "days": 1, "upi": "UPI22910394", "desc": "Immersion Procession Sponsor", "show": True, "status": "VERIFIED"},
            
            # Pending Donations (Waiting for Admin Verification)
            {"donor_name": "Mahesh Babu", "amount": 3500.0, "days": 0, "upi": "UPI99001122", "desc": "Morning Aarti Prasadam", "show": True, "status": "PENDING"},
            {"donor_name": "Kavitha Rao", "amount": 2000.0, "days": 0, "upi": "UPI44556677", "desc": "Puja Materials", "show": True, "status": "PENDING"},
            {"donor_name": "Vikram Singh", "amount": 1000.0, "days": 0, "upi": "UPI88776655", "desc": "General Fund", "show": False, "status": "PENDING"},
        ]

        for d in sample_donations:
            don_date = today - timedelta(days=d["days"])
            donation = Donation(
                fund_id=fund.id,
                donor_name=d["donor_name"],
                amount=d["amount"],
                donation_date=don_date,
                payment_method="UPI",
                upi_transaction_id=d["upi"],
                description=d["desc"],
                status=d["status"],
                show_donor_name=d["show"],
                verified_at=datetime.utcnow() if d["status"] == "VERIFIED" else None,
                verified_by=admin.id if d["status"] == "VERIFIED" else None
            )
            db.add(donation)

        # 4. Sample Expenses
        sample_expenses = [
            {"purpose": "Clay Ganesha Idol Custom Crafting", "amount": 18000.0, "days": 5, "handler": "Venkat Raman", "status": "SPENT", "desc": "8ft eco-friendly clay idol with organic dyes"},
            {"purpose": "Pandal Flower Decoration & Lighting", "amount": 12500.0, "days": 4, "handler": "Suresh Kumar", "status": "SPENT", "desc": "Marigold garlands, LED festoon lights and entrance arch"},
            {"purpose": "Sound System & Mic Set Booking", "amount": 8000.0, "days": 3, "handler": "Ravi Kumar", "status": "SPENT", "desc": "3-day audio speaker set for devotional songs and Aarti"},
            {"purpose": "Maha Prasadam Annadanam Groceries", "amount": 9500.0, "days": 2, "handler": "K. Rajesh", "status": "SPENT", "desc": "Rice, dal, ghee, dry fruits and cooking gas cylinders"},
            
            # Pending Expense Commitments
            {"purpose": "Immersion Procession Drums & Band", "amount": 6000.0, "days": 0, "handler": "M. Srinivas", "status": "PENDING", "desc": "Dhol tasha ensemble booking for Nimajjanam day"},
            {"purpose": "Cleanliness & Sanitation Worker Honorarium", "amount": 3000.0, "days": 0, "handler": "Suresh Kumar", "status": "PENDING", "desc": "Daily waste clearing and mandap disinfection"},
        ]

        for e in sample_expenses:
            exp_date = today - timedelta(days=e["days"])
            expense = Expense(
                fund_id=fund.id,
                amount=e["amount"],
                purpose=e["purpose"],
                description=e["desc"],
                handled_by=e["handler"],
                expense_date=exp_date,
                status=e["status"]
            )
            db.add(expense)

        db.commit()
        print("Successfully seeded demo data!")
        print("Default Admin: admin@vinayaka.org / admin123")
        print("Default Fund Slug: vinayaka-chavithi-2026")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
