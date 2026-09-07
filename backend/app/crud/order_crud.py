import logging
from sqlalchemy.orm import Session, joinedload
from datetime import date
from uuid import uuid4

from app.models.order_details import OrderDetails
from app.models.order_items import OrderItems
from app.models.equipment_qty import EquipmentQty
from app.models.user_details import UserDetails

logger = logging.getLogger(__name__)

# =========================================================
# ✅ CREATE ORDER (ISSUE MULTIPLE EQUIPMENT)
# =========================================================
def create_order(db: Session, data):
    if hasattr(data, "model_dump"):
        data = data.model_dump()

    logger.info(f"Creating order for {data.get('issued_to_name')}")

    # 🔹 1. Researcher Auto-Registration / Lookup
    user_id = data.get("user_id")
    issued_to_name = data.get("issued_to_name")

    if not user_id and issued_to_name:
        try:
            existing_user = db.query(UserDetails).filter(
                UserDetails.full_name == issued_to_name
            ).first()
            
            if existing_user:
                user_id = existing_user.id
                logger.info(f"Found existing user {issued_to_name} (ID: {user_id})")
            else:
                # Auto-create researcher entry
                new_user = UserDetails(
                    full_name=issued_to_name,
                    user_type="researcher",
                    id_proof_number=data.get("issued_to_id_proof"),
                    is_active=True
                )
                db.add(new_user)
                db.flush()
                user_id = new_user.id
                logger.info(f"Created new researcher user {issued_to_name} (ID: {user_id})")
        except Exception as e:
            logger.error(f"Error in user auto-registration: {str(e)}")
            raise Exception(f"User registration failed: {str(e)}")

    if not data.get("items") or len(data["items"]) == 0:
         raise Exception("Cannot create an order with no items")

    # 🔹 2. Create Order
    order = OrderDetails(
        user_id=user_id,
        approved_by_user_id=data.get("approved_by_user_id"),
        issued_to_name=issued_to_name,
        approved_by_name=data["approved_by_name"],
        issue_date=data["issue_date"],
        expected_return_date=data.get("expected_return_date"),
        purpose=data.get("purpose"),
        purpose_details=data.get("purpose_details"),
        status="ISSUED"
    )

    db.add(order)
    db.flush()  # get order.id

    # 🔹 Process items
    for item in data["items"]:

        equipment_id = item["equipment_id"]
        required_qty = item["quantity_issued"] if "quantity_issued" in item else item.get("quantity", 0)

        # ✅ Only allow issuing from usable stock IN THE SELECTED STORE
        valid_conditions = ["NEW", "MODERATE"]

        inventory_list = db.query(EquipmentQty).filter(
            EquipmentQty.equipment_id == equipment_id,
            EquipmentQty.store_id == item["store_id"],
            EquipmentQty.curr_condition.in_(valid_conditions)
        ).all()

        total_available = sum(i.quantity for i in inventory_list)

        if total_available < required_qty:
            raise Exception(f"Not enough stock in store for {equipment_id}")

        # 🔥 Smart deduction (NEW first, then MODERATE)
        remaining = required_qty

        # Sort inventory_list to ensure NEW is first
        inventory_list.sort(key=lambda x: 0 if x.curr_condition == "NEW" else 1)

        for inv in inventory_list:
            if inv.quantity >= remaining:
                inv.quantity -= remaining
                remaining = 0
                break
            else:
                remaining -= inv.quantity
                inv.quantity = 0
        
        if remaining > 0:
             raise Exception(f"Failed to deduct full quantity for {equipment_id}")

        # 🔹 Create OrderItem
        order_item = OrderItems(
            order_id=order.id,
            equipment_id=equipment_id,
            store_id=item["store_id"],
            quantity_issued=required_qty,
            quantity_returned=0,
            quantity_pending=required_qty,
            quantity_lost=0
        )

        db.add(order_item)

    # 🔹 Update user stats (only if user_id is provided)
    if data.get("user_id"):
        user = db.query(UserDetails).filter(UserDetails.id == data["user_id"]).first()
        if user:
            if not hasattr(user, 'total_issues') or user.total_issues is None:
                 user.total_issues = 0
            user.total_issues += 1

    db.commit()
    db.refresh(order)

    return order

# =========================================================
# ✅ RETURN ITEMS (MULTIPLE EQUIPMENT)
# =========================================================
def return_items(db: Session, data):

    if hasattr(data, "model_dump"):
        data = data.model_dump()

    # 🔹 Get order
    order = db.query(OrderDetails).filter(OrderDetails.id == data["order_id"]).first()

    if not order:
        raise Exception("Order not found")

    if order.status == "CANCELLED":
        raise Exception("Cannot return cancelled order")

    total_issued = 0
    total_returned = 0

    # 🔹 Process each item
    for item_data in data["items"]:

        order_item = db.query(OrderItems).filter(
            OrderItems.id == item_data["order_item_id"]
        ).first()

        if not order_item:
            raise Exception(f"Order item {item_data['order_item_id']} not found")

        return_qty = item_data["quantity_returned"]
        lost_qty = item_data.get("quantity_lost", 0)

        total_action = return_qty + lost_qty

        if total_action > order_item.quantity_pending:
            raise Exception("Return exceeds pending quantity")

        # 🔹 Update item quantities
        order_item.quantity_returned += return_qty
        order_item.quantity_lost += lost_qty
        order_item.quantity_pending -= total_action

        # 🔹 INVENTORY UPDATE
        condition = item_data.get("return_condition", "NEW")

        if condition != "DISCARD":
            # 1. Try to find exactly matching condition record
            stock = db.query(EquipmentQty).filter(
                EquipmentQty.equipment_id == order_item.equipment_id,
                EquipmentQty.store_id == order_item.store_id,
                EquipmentQty.curr_condition == condition
            ).first()

            if stock:
                # ✅ Update existing
                stock.quantity += return_qty
            else:
                # 2. Create new condition entry
                new_stock = EquipmentQty(
                    id=str(uuid4()),
                    equipment_id=order_item.equipment_id,
                    store_id=order_item.store_id,
                    curr_condition=condition,
                    quantity=return_qty
                )
                db.add(new_stock)
                db.flush()

        # 🔹 Aggregate for status
        total_issued += order_item.quantity_issued
        total_returned += order_item.quantity_returned

    # =====================================================
    # 🔥 STATUS LOGIC
    # =====================================================
    manual_status = data.get("status")
    if manual_status:
        order.status = manual_status
    else:
        pending = sum(item.quantity_pending for item in order.items)
        if pending == 0:
            order.status = "COMPLETED"
            order.actual_return_date = data.get("actual_return_date") or date.today()
        elif total_returned > 0:
            order.status = "PARTIALLY_RETURNED"

    # =====================================================
    # 🔹 USER PENALTY LOGIC
    # =====================================================
    user = db.query(UserDetails).filter(UserDetails.id == order.user_id).first()

    if user:
        total_lost = sum(item.get("quantity_lost", 0) for item in data["items"])

        if total_lost > 0:
            penalty_amount = total_lost * 1000  # simple logic
            if not hasattr(user, 'total_penalties') or user.total_penalties is None:
                user.total_penalties = 0
            if not hasattr(user, 'total_penalty_amount') or user.total_penalty_amount is None:
                user.total_penalty_amount = 0
                
            user.total_penalties += 1
            user.total_penalty_amount += penalty_amount

    db.commit()
    db.refresh(order)

    return order

# =========================================================
# ✅ GET ALL ORDERS
# =========================================================
def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(OrderDetails).options(
        joinedload(OrderDetails.items)
    ).offset(skip).limit(limit).all()

# =========================================================
# ✅ GET ORDER BY ID
# =========================================================
def get_order_by_id(db: Session, order_id: int):
    return db.query(OrderDetails).options(
        joinedload(OrderDetails.items)
    ).filter(OrderDetails.id == order_id).first()

# =========================================================
# ✅ CANCEL ORDER
# =========================================================
def cancel_order(db: Session, order_id: int):
    order = db.query(OrderDetails).filter(OrderDetails.id == order_id).first()

    if not order:
        raise Exception("Order not found")

    if order.status == "COMPLETED":
        raise Exception("Cannot cancel completed order")

    # 🔥 RETURN STOCK LOGIC
    for item in order.items:
        # Re-add to inventory (Assume NEW/MODERATE split)
        # For simplicity, we'll just put it back to whatever condition was issued?
        # Actually, create_order doesn't track *which* condition was issued per item.
        # It just deducts. Let's just put it back to "MODERATE" or "NEW" proportionally?
        # Standard approach: put it back to NEW.
        stock = db.query(EquipmentQty).filter(
            EquipmentQty.equipment_id == item.equipment_id,
            EquipmentQty.store_id == item.store_id,
            EquipmentQty.curr_condition == "NEW"
        ).first()
        if stock:
            stock.quantity += item.quantity_issued
        else:
             new_stock = EquipmentQty(
                id=str(uuid4()),
                equipment_id=item.equipment_id,
                store_id=item.store_id,
                curr_condition="NEW",
                quantity=item.quantity_issued
            )
             db.add(new_stock)

    order.status = "CANCELLED"
    db.commit()
    db.refresh(order)
    return order
