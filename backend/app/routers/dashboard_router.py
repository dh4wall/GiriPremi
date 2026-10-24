from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.models.equipment import Equipment
from app.models.equipment_qty import EquipmentQty
from app.models.order_details import OrderDetails
from app.models.order_items import OrderItems
from app.models.user_details import UserDetails

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/telemetry")
def get_dashboard_telemetry(db: Session = Depends(get_db)):
    today = date.today()
    equipment = db.query(Equipment).all()
    quantities = db.query(EquipmentQty).all()
    orders = db.query(OrderDetails).order_by(OrderDetails.issue_date.desc(), OrderDetails.id.desc()).all()
    order_items = db.query(OrderItems).all()
    categories = {category.id: category.name for category in db.query(Category).all()}
    active_members = db.query(UserDetails).filter(UserDetails.is_active.is_(True)).count()

    quantity_by_equipment = defaultdict(int)
    condition_by_equipment = {}
    for quantity in quantities:
        quantity_by_equipment[quantity.equipment_id] += quantity.quantity or 0
        condition_by_equipment[quantity.equipment_id] = quantity.curr_condition

    available_gear = sum(quantity_by_equipment.values())
    issued_today = sum(
        item.quantity_issued or 0
        for item in order_items
        if item.order and item.order.issue_date == today
    )
    inspection_due = sum(
        1 for item in equipment
        if item.date_of_expiry and 0 <= (item.date_of_expiry - today).days <= 48
    )

    category_totals = defaultdict(int)
    for item in equipment:
        category_totals[categories.get(item.category_id, "Other")] += quantity_by_equipment[item.id]
    category_share = [
        {"name": name, "units": units}
        for name, units in sorted(category_totals.items(), key=lambda entry: entry[1], reverse=True)
    ]

    weekly_flow = []
    for week in range(4):
        end = today - timedelta(days=week * 7)
        start = end - timedelta(days=6)
        matching_orders = [order for order in orders if start <= order.issue_date <= end]
        issued = sum(
            item.quantity_issued or 0
            for item in order_items
            if item.order_id in {order.id for order in matching_orders}
        )
        returned = sum(
            item.quantity_returned or 0
            for item in order_items
            if item.order_id in {order.id for order in matching_orders}
        )
        weekly_flow.insert(0, {
            "label": f"{start.strftime('%d %b')} - {end.strftime('%d %b')}",
            "issued": issued,
            "returned": returned,
        })

    recent_activity = []
    equipment_by_id = {item.id: item for item in equipment}
    for order in orders[:8]:
        first_item = order.items[0] if order.items else None
        equipment_item = equipment_by_id.get(first_item.equipment_id) if first_item else None
        recent_activity.append({
            "id": order.id,
            "item": equipment_item.equipment_name if equipment_item else "Equipment dispatch",
            "sku": first_item.equipment_id if first_item else None,
            "member": order.issued_to_name or "Unassigned",
            "action": "Returned" if order.status in {"RETURNED", "COMPLETED"} else "Issued",
            "date": order.issue_date.isoformat() if order.issue_date else None,
            "status": order.status.replace("_", " ").title() if order.status else "Pending",
        })

    return {
        "metrics": {
            "available_gear": available_gear,
            "issued_today": issued_today,
            "inspection_due": inspection_due,
            "active_members": active_members,
        },
        "weekly_flow": weekly_flow,
        "category_share": category_share,
        "condition": {
            "new": sum(1 for value in condition_by_equipment.values() if str(value).upper() == "NEW"),
            "moderate": sum(1 for value in condition_by_equipment.values() if str(value).upper() == "MODERATE"),
            "service_due": inspection_due,
        },
        "recent_activity": recent_activity,
    }
