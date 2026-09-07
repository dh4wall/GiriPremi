import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.order_schema import (
    OrderCreate,
    OrderResponse,
    OrderReturn
)
from app.crud import order_crud

router = APIRouter(prefix="/orders", tags=["Orders"])
logger = logging.getLogger(__name__)

# ===============================
# 1. CREATE ORDER (Issue Multiple Equipment)
# ===============================
@router.post("/", response_model=OrderResponse)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    try:
        return order_crud.create_order(db, data)
    except Exception as e:
        logger.error(f"Order creation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

# ===============================
# 2. GET ALL ORDERS
# ===============================
@router.get("/", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return order_crud.get_orders(db)

# ===============================
# 3. GET ORDER BY ID
# ===============================
@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = order_crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ===============================
# 4. RETURN EQUIPMENT
# ===============================
@router.post("/return", response_model=OrderResponse)
def return_items(data: OrderReturn, db: Session = Depends(get_db)):
    try:
        return order_crud.return_items(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===============================
# 5. CANCEL ORDER
# ===============================
@router.patch("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    try:
        return order_crud.cancel_order(db, order_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
