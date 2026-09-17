from sqlalchemy.orm import Session
from app.models.user_details import UserDetails
from app.schemas.user_details_schema import UserDetailsCreate, UserDetailsUpdate
from app.auth import hash_password


def get_user(db: Session, user_id: int):
    return db.query(UserDetails).filter(UserDetails.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    """Lookup a user by email address (used by auth login)."""
    return db.query(UserDetails).filter(UserDetails.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(UserDetails).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserDetailsCreate):
    data = user.model_dump()
    # Hash password if provided
    if data.get("password"):
        data["password"] = hash_password(data["password"])
    db_user = UserDetails(**data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: UserDetailsUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user.model_dump(exclude_unset=True)
        # Hash password if being updated
        if "password" in update_data and update_data["password"]:
            update_data["password"] = hash_password(update_data["password"])
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user
