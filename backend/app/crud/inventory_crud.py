from sqlalchemy.orm import Session
from uuid import uuid4
from app.models.equipment_qty import EquipmentQty
from app.models.equipment import Equipment

def add_inventory(db: Session, data):
    if hasattr(data, "model_dump"):
        data = data.model_dump()

    # Validate equipment exists
    equipment = db.query(Equipment).filter(Equipment.id == data["equipment_id"]).first()
    if not equipment:
        raise Exception("Invalid equipment_id")

    # Check if same condition already exists in the SAME store -> update instead of insert
    existing = db.query(EquipmentQty).filter(
        EquipmentQty.equipment_id == data["equipment_id"],
        EquipmentQty.store_id == data["store_id"],
        EquipmentQty.curr_condition == data["curr_condition"]
    ).first()

    if existing:
        existing.quantity += data["quantity"]
        db.commit()
        db.refresh(existing)
        return existing

    inventory = EquipmentQty(
        id=str(uuid4()),
        **data
    )

    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return inventory

def get_all_inventory(db: Session):
    return db.query(EquipmentQty).all()

def get_inventory_by_equipment(db: Session, equipment_id: str):
    return db.query(EquipmentQty).filter(
        EquipmentQty.equipment_id == equipment_id
    ).all()

def get_inventory_by_store(db: Session, store_id: int):
    return db.query(EquipmentQty).filter(
        EquipmentQty.store_id == store_id
    ).all()

def update_inventory(db: Session, inventory_id: str, data):
    inventory = db.query(EquipmentQty).filter(
        EquipmentQty.id == inventory_id
    ).first()

    if not inventory:
        return None

    if hasattr(data, "model_dump"):
        data = data.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(inventory, key, value)

    db.commit()
    db.refresh(inventory)

    return inventory

def delete_inventory(db: Session, inventory_id: str):
    inventory = db.query(EquipmentQty).filter(
        EquipmentQty.id == inventory_id
    ).first()

    if not inventory:
        return None

    db.delete(inventory)
    db.commit()

    return inventory
