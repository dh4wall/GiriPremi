"""
Run this once to create all database tables and seed default stores.
Usage: python init_db.py
"""
from app.database import engine, Base, SessionLocal
from app.models import category, equipment, store, user_details, equipment_qty, order_details, order_items  # noqa — registers models


def init():
    print("Dropping existing tables to reset IDs...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()
    try:
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
    finally:
        db.close()

    print("Done! Database is ready.")


if __name__ == "__main__":
    init()
