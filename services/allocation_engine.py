"""
KisanSetu — Allocation Engine Service.

Analyses demand vs capacity across all procurement centres,
detects imbalances, and generates redistribution recommendations.
"""

from datetime import date as date_type
from typing import Any

from sqlalchemy.orm import Session

from models import Centre, Slot


# Map start_time strings to display hour labels
_HOUR_LABELS = {
    "08:00": "08 AM",
    "09:00": "09 AM",
    "10:00": "10 AM",
    "10:30": "10 AM",   # group 10:30 into 10 AM hour
    "11:00": "11 AM",
    "12:00": "12 PM",
    "13:00": "01 PM",
}


def _slot_hour_label(start_time: str) -> str:
    """Convert a start_time string like '10:30' to a display label like '10 AM'."""
    return _HOUR_LABELS.get(start_time, start_time)


def get_demand_capacity(db: Session, centre_id: int, date: str) -> list[dict[str, Any]]:
    """
    Get hourly demand vs capacity data for charts.

    Returns a list of {hour, demand, capacity} dicts for each hour
    of the operating day.
    """
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        return []

    capacity_per_hour = centre.capacity_per_hour or 60

    slots = (
        db.query(Slot)
        .filter(Slot.centre_id == centre_id, Slot.date == date)
        .order_by(Slot.start_time)
        .all()
    )

    # Aggregate demand by hour
    hourly_data: dict[str, int] = {}
    for slot in slots:
        hour_label = _slot_hour_label(slot.start_time)
        hourly_data[hour_label] = hourly_data.get(hour_label, 0) + slot.booked_count

    # Build ordered result
    hour_order = ["08 AM", "09 AM", "10 AM", "11 AM", "12 PM", "01 PM"]
    result = []
    for hour in hour_order:
        if hour in hourly_data:
            result.append({
                "hour": hour,
                "demand": hourly_data[hour],
                "capacity": capacity_per_hour,
            })

    return result


def detect_imbalances(db: Session, date: str | None = None) -> list[dict[str, Any]]:
    """
    Detect centres where demand exceeds capacity at any hour.

    For each overloaded centre, finds the best target centre
    (the one with the most spare capacity) and generates a
    redistribution recommendation.
    """
    if not date:
        date = date_type.today().isoformat()

    centres = db.query(Centre).all()
    imbalances = []

    for centre in centres:
        capacity = centre.capacity_per_hour or 60
        demand_data = get_demand_capacity(db, centre.id, date)

        # Find peak hour where demand exceeds capacity
        for point in demand_data:
            if point["demand"] > capacity:
                excess = point["demand"] - capacity

                # Find best target: centre with most spare capacity at this hour
                best_target = None
                best_spare = 0

                for other in centres:
                    if other.id == centre.id:
                        continue
                    other_data = get_demand_capacity(db, other.id, date)
                    # Find matching hour or assume it has full spare capacity
                    other_demand = 0
                    for op in other_data:
                        if op["hour"] == point["hour"]:
                            other_demand = op["demand"]
                            break
                    other_capacity = other.capacity_per_hour or 60
                    spare = other_capacity - other_demand
                    if spare > best_spare:
                        best_spare = spare
                        best_target = other

                if best_target:
                    move_count = min(excess, best_spare)
                    imbalances.append({
                        "centre_name": centre.name,
                        "centre_id": centre.id,
                        "peak_hour": point["hour"],
                        "excess_demand": excess,
                        "recommendation": (
                            f"Move {move_count} appointments from "
                            f"{centre.name.split(' ')[0]} → {best_target.name.split(' ')[0]}"
                        ),
                        "target_centre": best_target.name,
                        "target_centre_id": best_target.id,
                        "move_count": move_count,
                    })
                break  # Only report the worst hour per centre

    return imbalances


def apply_redistribution(
    db: Session,
    source_centre_id: int,
    target_centre_id: int,
    move_count: int,
    date: str,
) -> dict[str, Any]:
    """
    Apply a redistribution recommendation.

    For the prototype, this adjusts booked_counts on the source
    and target slots to simulate the redistribution.
    """
    if move_count <= 0:
        raise ValueError("Move count must be greater than zero")
    if source_centre_id == target_centre_id:
        raise ValueError("Source and target centres must be different")

    source_centre = db.query(Centre).filter(Centre.id == source_centre_id).first()
    target_centre = db.query(Centre).filter(Centre.id == target_centre_id).first()

    if not source_centre or not target_centre:
        raise ValueError("Source or target centre not found")

    # Find the most overloaded slot at the source
    source_slots = (
        db.query(Slot)
        .filter(Slot.centre_id == source_centre_id, Slot.date == date)
        .order_by(Slot.booked_count.desc())
        .all()
    )

    # Find the least loaded slot at the target
    target_slots = (
        db.query(Slot)
        .filter(Slot.centre_id == target_centre_id, Slot.date == date)
        .order_by(Slot.booked_count.asc())
        .all()
    )

    moved = 0
    for s_slot in source_slots:
        if moved >= move_count:
            break
        can_move = min(s_slot.booked_count, move_count - moved)
        if can_move <= 0:
            continue

        # Find a target slot with capacity
        for t_slot in target_slots:
            spare = t_slot.max_capacity - t_slot.booked_count
            if spare <= 0:
                continue
            transfer = min(can_move, spare)
            s_slot.booked_count -= transfer
            t_slot.booked_count += transfer
            moved += transfer
            break

    db.commit()

    return {
        "status": "success",
        "moved_count": moved,
        "source_centre": source_centre.name,
        "target_centre": target_centre.name,
        "date": date,
        "message": f"Successfully redistributed {moved} appointments from {source_centre.name.split(' ')[0]} to {target_centre.name.split(' ')[0]}.",
    }
