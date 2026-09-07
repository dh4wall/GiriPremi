from sqlalchemy import Column, String, Integer, ForeignKey, BigInteger
from app.database import Base

class EquipmentQty(Base):
    __tablename__ = "equipment_qty"

    id = Column(String(36), primary_key=True)
    equipment_id = Column(String(36), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    store_id = Column(BigInteger, ForeignKey("store.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    curr_condition = Column(String(50), nullable=False)
