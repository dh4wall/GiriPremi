from sqlalchemy.orm import Session
from app.models.store import Store

def create_store(db: Session, data):
    if hasattr(data, "model_dump"):
        data = data.model_dump()

    # Unique name check
    existing = db.query(Store).filter(Store.name == data["name"]).first()
    if existing:
        raise Exception("Store with this name already exists")

    store = Store(**data)
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

def get_all_stores(db: Session):
    return db.query(Store).all()

def get_store_by_id(db: Session, store_id: int):
    return db.query(Store).filter(Store.id == store_id).first()

def update_store(db: Session, store_id: int, data):
    store = get_store_by_id(db, store_id)
    if not store:
        return None

    if hasattr(data, "model_dump"):
        update_data = data.model_dump(exclude_unset=True)
    else:
        update_data = data

    for key, value in update_data.items():
        setattr(store, key, value)

    db.commit()
    db.refresh(store)
    return store

def delete_store(db: Session, store_id: int):
    store = get_store_by_id(db, store_id)
    if not store:
        return None

    # Soft delete as per b2
    store.is_active = False
    db.commit()
    db.refresh(store)
    return store
