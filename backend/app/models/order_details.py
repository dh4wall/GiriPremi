from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class OrderDetails(Base):
    __tablename__ = "order_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_details.id", ondelete="CASCADE"), nullable=True)
    approved_by_user_id = Column(Integer, ForeignKey("user_details.id", ondelete="CASCADE"), nullable=True)
    issued_to_name = Column(String(100))
    approved_by_name = Column(String(100))
    issue_date = Column(Date, nullable=False)
    expected_return_date = Column(Date)
    purpose = Column(String(50))
    purpose_details = Column(Text)
    status = Column(String(50), default="PENDING")
    actual_return_date = Column(Date)
    remarks = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )

    items = relationship("OrderItems", backref="order", cascade="all, delete-orphan")
