from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey
from app.database import Base

class OrderItems(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("order_details.id", ondelete="CASCADE"), nullable=False)
    equipment_id = Column(String(36), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    store_id = Column(BigInteger, ForeignKey("store.id", ondelete="CASCADE"), nullable=False)
    return_condition = Column(String(50))
    quantity_issued = Column(Integer, default=0)
    quantity_returned = Column(Integer, default=0)
    quantity_pending = Column(Integer, default=0)
    quantity_lost = Column(Integer, default=0)
