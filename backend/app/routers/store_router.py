from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.store_schema import (
    StoreCreate,
    StoreUpdate,
    StoreResponse
)
from app.crud import store_crud

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.post("/", response_model=StoreResponse)
def create_store(data: StoreCreate, db: Session = Depends(get_db)):
    try:
        return store_crud.create_store(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    return store_crud.get_all_stores(db)

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = store_crud.get_store_by_id(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Not found")
    return store

@router.patch("/{store_id}", response_model=StoreResponse)
def update_store(store_id: int, data: StoreUpdate, db: Session = Depends(get_db)):
    updated = store_crud.update_store(db, store_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    return updated

@router.delete("/{store_id}")
def delete_store(store_id: int, db: Session = Depends(get_db)):
    deleted = store_crud.delete_store(db, store_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Store deactivated"}
