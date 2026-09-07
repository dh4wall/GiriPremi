from sqlalchemy.orm import Session
from app.models.equipment_qty import EquipmentQty
from app.schemas.equipment_qty_schema import EquipmentQtyCreate, EquipmentQtyUpdate
import uuid

def get_equipment_qty(db: Session, qty_id: str):
    return db.query(EquipmentQty).filter(EquipmentQty.id == qty_id).first()

def get_equipment_qtys(db: Session, equipment_id: str = None):
    query = db.query(EquipmentQty)
    if equipment_id:
        query = query.filter(EquipmentQty.equipment_id == equipment_id)
    return query.all()

def create_equipment_qty(db: Session, qty: EquipmentQtyCreate):
    if not qty.id:
        qty.id = str(uuid.uuid4())
    db_qty = EquipmentQty(**qty.model_dump())
    db.add(db_qty)
    db.commit()
    db.refresh(db_qty)
    return db_qty

def update_equipment_qty(db: Session, qty_id: str, qty: EquipmentQtyUpdate):
    db_qty = get_equipment_qty(db, qty_id)
    if db_qty:
        update_data = qty.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_qty, key, value)
        db.commit()
        db.refresh(db_qty)
    return db_qty
