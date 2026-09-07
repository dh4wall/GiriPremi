"""
CRUD operations for equipment.
"""

from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime, date
from app.models.equipment import Equipment
from app.models.category import Category
from app.models.store import Store
from app.models.equipment_qty import EquipmentQty


def _parse_date(date_val):
    if not date_val:
        return None
    if isinstance(date_val, (datetime, date)):
        return date_val.date() if isinstance(date_val, datetime) else date_val
    if isinstance(date_val, str):
        # Remove any time component if present (e.g. from Excel timestamp strings)
        date_str = date_val.split(' ')[0].split('T')[0]
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
    return None


def create_equipment(db: Session, data):

    # ✅ handle both dict and pydantic
    if hasattr(data, "model_dump"):
        data = data.model_dump()
    else:
        # If it's already a dict, make a copy to avoid mutating the original
        data = data.copy()

    # ✅ Validate category
    category_id = data.get("category_id")
    if not category_id:
        raise Exception("category_id is required")

    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise Exception(f"Category ID {category_id} not found")

    # ✅ Validate store
    store_id = data.get("current_store_id")
    if store_id:
        store = db.query(Store).filter(Store.id == store_id).first()
        if not store:
            raise Exception(f"Store ID {store_id} not found")

    # ✅ Parse dates before creating the model
    data["purchase_date"] = _parse_date(data.get("purchase_date"))
    data["date_of_manufacturing"] = _parse_date(data.get("date_of_manufacturing"))
    data["date_of_expiry"] = _parse_date(data.get("date_of_expiry"))

    # ✅ Expiry validation
    if data["date_of_expiry"] and data["purchase_date"]:
        if data["date_of_expiry"] <= data["purchase_date"]:
            raise Exception("Expiry date must be after purchase date")

    # ✅ Extract initial quantity and condition if present
    initial_quantity = data.pop("initial_quantity", 1)
    initial_condition = data.pop("initial_condition", "NEW")

    # ✅ Validate store for quantity record
    store_id = data.get("current_store_id")
    if not store_id and initial_quantity > 0:
        raise Exception("current_store_id is required to create initial inventory")

    # ✅ Check if equipment with same name, category, and brand already exists
    equipment = db.query(Equipment).filter(
        Equipment.equipment_name == data["equipment_name"],
        Equipment.category_id == data["category_id"],
        Equipment.brand == data.get("brand")
    ).first()

    if not equipment:
        equipment = Equipment(
            id=str(uuid4()),
            **data
        )
        db.add(equipment)
        db.commit()
        db.refresh(equipment)
    else:
        # Optionally update existing equipment fields if they were None/empty
        for key, value in data.items():
            if value and not getattr(equipment, key):
                setattr(equipment, key, value)
        db.commit()

    # ✅ Update quantity table (check for existing equipment_id + store_id + condition)
    qty_record = db.query(EquipmentQty).filter(
        EquipmentQty.equipment_id == equipment.id,
        EquipmentQty.store_id == store_id,
        EquipmentQty.curr_condition == initial_condition
    ).first()

    if qty_record:
        qty_record.quantity += initial_quantity
    else:
        qty_record = EquipmentQty(
            id=str(uuid4()),
            equipment_id=equipment.id,
            store_id=store_id,
            quantity=initial_quantity,
            curr_condition=initial_condition
        )
        db.add(qty_record)

    db.commit()
    db.refresh(qty_record)

    return equipment

from sqlalchemy import func

def get_all_equipment(db: Session):
    # Join equipment with equipment_qty and sum the quantity
    results = db.query(
        Equipment,
        func.coalesce(func.sum(EquipmentQty.quantity), 0).label("quantity")
    ).outerjoin(EquipmentQty, Equipment.id == EquipmentQty.equipment_id)\
     .group_by(Equipment.id).all()
    
    # Map results back to equipment objects with a temporary quantity attribute
    equipment_list = []
    for eq, qty in results:
        eq.quantity = qty
        equipment_list.append(eq)
        
    return equipment_list


def get_equipment_by_id(db: Session, equipment_id: str):
    return db.query(Equipment).filter(Equipment.id == equipment_id).first()


def update_equipment(db: Session, equipment_id: str, data):
    equipment = get_equipment_by_id(db, equipment_id)

    if not equipment:
        return None

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(equipment, key, value)

    db.commit()
    db.refresh(equipment)

    return equipment


def delete_equipment(db: Session, equipment_id: str):
    equipment = get_equipment_by_id(db, equipment_id)

    if not equipment:
        return None

    db.delete(equipment)
    db.commit()

    return equipment