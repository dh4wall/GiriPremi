from sqlalchemy.orm import Session
from app.models.user_details import UserDetails
from app.schemas.user_details_schema import UserDetailsCreate, UserDetailsUpdate

def get_user(db: Session, user_id: int):
    return db.query(UserDetails).filter(UserDetails.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(UserDetails).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserDetailsCreate):
    db_user = UserDetails(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserDetailsUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user
