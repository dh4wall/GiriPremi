"""
Run this once to create all database tables and seed default stores + users.
Usage:  uv run python init_db.py
        (or: python init_db.py)

Default seeded credentials
──────────────────────────
  superAdmin  →  admin@giripremi.com   / Admin@123
  storeAdmin  →  store@giripremi.com   / Store@123
  member      →  member@giripremi.com  / Member@123
"""

from app.database import engine, Base, SessionLocal
from app.models import (  # noqa — registers all models with Base
    category, equipment, store, user_details, equipment_qty, order_details, order_items
)
from app.auth import hash_password


def init():
    print("Dropping existing tables to reset IDs...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()
    try:
        # ── Seed default stores ────────────────────────────────────────────────
        from app.models.store import Store
        if db.query(Store).count() == 0:
            stores = [
                Store(id=1, name="Store 1", contact_person="", contact_number=""),
                Store(id=2, name="Store 2", contact_person="", contact_number=""),
                Store(id=3, name="Base Camp Warehouse", contact_person="", contact_number=""),
            ]
            db.add_all(stores)
            db.commit()
            print("Default stores seeded.")
        else:
            print("Stores already exist, skipping seed.")

        # ── Seed default users (one per role) ─────────────────────────────────
        from app.models.user_details import UserDetails
        seed_users = [
            {
                "full_name": "Super Admin",
                "email": "admin@giripremi.com",
                "password": hash_password("Admin@123"),
                "user_type": "superAdmin",
                "contact_number": "",
                "is_active": True,
            },
            {
                "full_name": "Store Manager",
                "email": "store@giripremi.com",
                "password": hash_password("Store@123"),
                "user_type": "storeAdmin",
                "contact_number": "",
                "is_active": True,
            },
            {
                "full_name": "Club Member",
                "email": "member@giripremi.com",
                "password": hash_password("Member@123"),
                "user_type": "member",
                "contact_number": "",
                "is_active": True,
            },
        ]

        for u in seed_users:
            existing = db.query(UserDetails).filter(UserDetails.email == u["email"]).first()
            if not existing:
                db.add(UserDetails(**u))
        db.commit()
        print("Default users seeded.")

    finally:
        db.close()

    print("\nDone! Database is ready.")
    print("\nLogin credentials:")
    print("  superAdmin  →  admin@giripremi.com   / Admin@123")
    print("  storeAdmin  →  store@giripremi.com   / Store@123")
    print("  member      →  member@giripremi.com  / Member@123")


if __name__ == "__main__":
    init()
