from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.inventory_schema import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse
)
from app.crud import inventory_crud

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/", response_model=List[InventoryResponse])
def get_all_inventory(db: Session = Depends(get_db)):
    return inventory_crud.get_all_inventory(db)

@router.post("/", response_model=InventoryResponse)
def add_inventory(data: InventoryCreate, db: Session = Depends(get_db)):
    try:
        return inventory_crud.add_inventory(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{equipment_id}", response_model=List[InventoryResponse])
def get_inventory(equipment_id: str, db: Session = Depends(get_db)):
    return inventory_crud.get_inventory_by_equipment(db, equipment_id)

@router.get("/store/{store_id}", response_model=List[InventoryResponse])
def get_inventory_by_store(store_id: int, db: Session = Depends(get_db)):
    return inventory_crud.get_inventory_by_store(db, store_id)

@router.patch("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(inventory_id: str, data: InventoryUpdate, db: Session = Depends(get_db)):
    updated = inventory_crud.update_inventory(db, inventory_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    return updated

@router.delete("/{inventory_id}")
def delete_inventory(inventory_id: str, db: Session = Depends(get_db)):
    deleted = inventory_crud.delete_inventory(db, inventory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted successfully"}
