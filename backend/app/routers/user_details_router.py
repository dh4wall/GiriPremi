from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user_details_schema import UserDetails, UserDetailsCreate, UserDetailsUpdate
from app.crud import user_details_crud

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserDetails)
def create_user(user: UserDetailsCreate, db: Session = Depends(get_db)):
    return user_details_crud.create_user(db=db, user=user)

@router.get("/", response_model=List[UserDetails])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = user_details_crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=UserDetails)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = user_details_crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.patch("/{user_id}", response_model=UserDetails)
def update_user(user_id: int, user: UserDetailsUpdate, db: Session = Depends(get_db)):
    db_user = user_details_crud.update_user(db, user_id=user_id, user=user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
