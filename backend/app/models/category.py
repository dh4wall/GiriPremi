"""
SQLAlchemy model for category table.
"""

from sqlalchemy import Column, Integer, String, Boolean, Text, DECIMAL, TIMESTAMP
from app.database import Base
from sqlalchemy import func

class Category(Base):
    """
    Category model representing equipment types.
    """
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    parent_category_type = Column(String(50))
    tracking_type = Column(String(50), nullable=False)
    requires_inspection = Column(Boolean, default=False)
    inspection_frequency_months = Column(Integer)
    product_life_year = Column(DECIMAL(3, 1))
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
    TIMESTAMP,
    server_default=func.now(),
    onupdate=func.now()
    )