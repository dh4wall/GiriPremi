"""
SQLAlchemy model for equipment table.
"""

from sqlalchemy import Column, String, Date, Boolean, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Equipment(Base):
    """
    Equipment master table.
    """

    __tablename__ = "equipment"

    id = Column(String(36), primary_key=True)
    equipment_name = Column(String(200), nullable=False)
    category_id = Column(ForeignKey("category.id", ondelete="CASCADE"), nullable=False)

    date_of_manufacturing = Column(Date)
    date_of_expiry = Column(Date)
    purchase_date = Column(Date)

    brand = Column(String(100))
    description = Column(Text)

    current_store_id = Column(ForeignKey("store.id", ondelete="CASCADE"))

    is_available = Column(Boolean, default=True)
    general_remark = Column(Text)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )