from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class UserDetails(Base):
    __tablename__ = "user_details"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100))
    password = Column(String(255), nullable=True)
    full_name = Column(String(200), nullable=False)
    contact_number = Column(String(20))
    user_type = Column(String(50), nullable=False)
    address = Column(Text)
    type = Column(String(50))
    id_proof_type = Column(String(50))
    id_proof_number = Column(String(100))
    total_issues = Column(Integer, default=0)
    total_penalties = Column(Integer, default=0)
    total_penalty_amount = Column(DECIMAL(10, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )
