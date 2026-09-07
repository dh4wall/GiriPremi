from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.equipment_qty_schema import EquipmentQty, EquipmentQtyCreate, EquipmentQtyUpdate
from app.crud import equipment_qty_crud

router = APIRouter(prefix="/equipment-qty", tags=["equipment-qty"])

@router.post("/", response_model=EquipmentQty)
def create_qty(qty: EquipmentQtyCreate, db: Session = Depends(get_db)):
    return equipment_qty_crud.create_equipment_qty(db=db, qty=qty)

@router.get("/", response_model=List[EquipmentQty])
def read_qtys(equipment_id: Optional[str] = None, db: Session = Depends(get_db)):
    return equipment_qty_crud.get_equipment_qtys(db, equipment_id=equipment_id)

@router.get("/{qty_id}", response_model=EquipmentQty)
def read_qty(qty_id: str, db: Session = Depends(get_db)):
    db_qty = equipment_qty_crud.get_equipment_qty(db, qty_id=qty_id)
    if db_qty is None:
        raise HTTPException(status_code=404, detail="Quantity record not found")
    return db_qty

@router.patch("/{qty_id}", response_model=EquipmentQty)
def update_qty(qty_id: str, qty: EquipmentQtyUpdate, db: Session = Depends(get_db)):
    db_qty = equipment_qty_crud.update_equipment_qty(db, qty_id=qty_id, qty=qty)
    if db_qty is None:
        raise HTTPException(status_code=404, detail="Quantity record not found")
    return db_qty
