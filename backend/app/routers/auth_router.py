"""
Authentication router.
Handles login and current-user endpoints.
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    verify_password,
    create_access_token,
    get_current_user,
)
from app.config import get_settings
from app.crud import user_details_crud
from app.database import get_db
from app.schemas.user_details_schema import LoginRequest, TokenResponse, MeResponse

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with email + password.
    Returns a JWT access token and basic user info.
    """
    user = user_details_crud.get_user_by_email(db, email=request.email)

    if user is None or not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact administration.",
        )

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "user_type": user.user_type,
        "full_name": user.full_name,
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_type=user.user_type,
        full_name=user.full_name,
        user_id=user.id,
    )


@router.get("/me", response_model=MeResponse)
def get_me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
