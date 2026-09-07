"""
API routes for equipment.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
import pandas as pd

from app.database import get_db
from app.schemas.equipment_schema import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse
)
from app.crud import equipment_crud

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.post("/", response_model=EquipmentResponse)
def create_equipment(data: EquipmentCreate, db: Session = Depends(get_db)):
    try:
        return equipment_crud.create_equipment(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[EquipmentResponse])
def get_equipment(db: Session = Depends(get_db)):
    return equipment_crud.get_all_equipment(db)


@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment_by_id(equipment_id: str, db: Session = Depends(get_db)):
    equipment = equipment_crud.get_equipment_by_id(db, equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Not found")
    return equipment


@router.patch("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(equipment_id: str, data: EquipmentUpdate, db: Session = Depends(get_db)):
    updated = equipment_crud.update_equipment(db, equipment_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    return updated


@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: str, db: Session = Depends(get_db)):
    deleted = equipment_crud.delete_equipment(db, equipment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted successfully"}

@router.post("/upload-excel")
def upload_equipment_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    import pandas as pd

    df = pd.read_excel(file.file)

    created = []
    errors = []

    for index, row in df.iterrows():
        try:
            # ✅ Handle NaN properly
            def clean(value):
                return None if pd.isna(value) else value

            data = {
                "equipment_name": clean(row.get("equipment_name")),
                "category_id": int(row["category_id"]) if not pd.isna(row["category_id"]) else None,
                "brand": clean(row.get("brand")),
                "description": clean(row.get("description")),
                "purchase_date": clean(row.get("purchase_date")),
                "date_of_expiry": clean(row.get("date_of_expiry")),
                "date_of_manufacturing": clean(row.get("date_of_manufacturing")),
                "current_store_id": int(row["current_store_id"]) if not pd.isna(row["current_store_id"]) else None,
                "general_remark": clean(row.get("general_remark")),
                # Support both 'quantity' and 'initial_quantity' column names
                "initial_quantity": int(row["quantity"]) if "quantity" in row and not pd.isna(row["quantity"]) \
                    else (int(row["initial_quantity"]) if "initial_quantity" in row and not pd.isna(row["initial_quantity"]) else 1),
                # Support both 'condition' and 'initial_condition' column names, default to NEW
                "initial_condition": (clean(row.get("condition")) or clean(row.get("initial_condition")) or "NEW"),
            }

            # ✅ Required field check
            if not data["equipment_name"] or not data["category_id"]:
                raise Exception("Missing required fields")

            equipment = equipment_crud.create_equipment(db, data)
            created.append(equipment.id)

        except Exception as e:
            errors.append(f"Row {index}: {str(e)}")

    return {
        "created_count": len(created),
        "errors": errors
    }