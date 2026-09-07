"""
API routes for category module.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
import pandas as pd
from app.crud import category_crud


from app.database import get_db
from app.schemas.category_schema import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse
)
from app.crud import category_crud

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return category_crud.create_category(db, category)


@router.get("/", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return category_crud.get_all_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = category_crud.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    updated = category_crud.update_category(db, category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    deleted = category_crud.delete_category(db, category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

from fastapi import UploadFile, File
import pandas as pd
from app.crud import category_crud


@router.post("/upload")
def upload_categories(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload categories using Excel file.
    """
    df = pd.read_excel(file.file)

    inserted = 0
    errors = []

    def clean(value):
        if pd.isna(value):
            return None
        return value

    def to_bool(value):
        if pd.isna(value):
            return False
        if isinstance(value, bool):
            return value
        v = str(value).lower().strip()
        return v in ("true", "1", "yes", "y", "t")

    for index, row in df.iterrows():
        try:
            # Map columns (flexible)
            name = clean(row.get("name"))
            if not name:
                raise Exception("Missing category name")

            data = {
                "name": str(name),
                "parent_category_type": clean(row.get("parent_category_type")) or "GENERAL",
                "tracking_type": str(clean(row.get("tracking_type")) or "QUANTITY").upper(),
                "requires_inspection": to_bool(row.get("requires_inspection")),
                "inspection_frequency_months": int(row["inspection_frequency_months"]) if not pd.isna(row.get("inspection_frequency_months")) else None,
                "product_life_year": float(row["product_life_year"]) if not pd.isna(row.get("product_life_year")) else None,
                "description": clean(row.get("description")),
            }

            category_crud.create_category(db, data)
            inserted += 1

        except Exception as e:
            errors.append(f"Row {index + 1}: {str(e)}")

    return {
        "total": len(df),
        "inserted": inserted,
        "failed": len(errors),
        "errors": errors
    }
