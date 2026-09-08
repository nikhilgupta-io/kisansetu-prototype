"""
KisanSetu — Slot Engine Service.

The dynamic slot allocation engine — the core innovation of KisanSetu.
Generates slot availability, recommends optimal slots based on load,
and handles slot booking with token generation.
"""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Farmer, Slot, Booking, QueueEntry

# Crop Perishability Index — higher = more urgent, prioritized for earlier slots
CROP_PERISHABILITY = {
    "Wheat":     {"score": 1, "label": "Low",    "max_safe_days": 90, "risk_factor": "Dry grain, long shelf life"},
    "Rice":      {"score": 1, "label": "Low",    "max_safe_days": 60, "risk_factor": "Dry grain, stable"},
    "Paddy":     {"score": 2, "label": "Medium", "max_safe_days": 7,  "risk_factor": "High moisture, fungus risk"},
    "Maize":     {"score": 2, "label": "Medium", "max_safe_days": 14, "risk_factor": "Insect damage if stored wet"},
    "Soybean":   {"score": 3, "label": "High",   "max_safe_days": 5,  "risk_factor": "Oil oxidation, rapid spoilage"},
    "Mustard":   {"score": 3, "label": "High",   "max_safe_days": 5,  "risk_factor": "Moisture-sensitive oilseed"},
    "Vegetables": {"score": 3, "label": "High",  "max_safe_days": 2,  "risk_factor": "Highly perishable, immediate loss"},
    "Fruits":    {"score": 3, "label": "High",   "max_safe_days": 3,  "risk_factor": "Bruising, ripening, rot"},
    "Pulses":    {"score": 2, "label": "Medium", "max_safe_days": 30, "risk_factor": "Weevil infestation risk"},
}

def get_perishability(crop_name: str) -> dict:
    """Get perishability info for a crop. Defaults to low risk."""
    return CROP_PERISHABILITY.get(crop_name, {"score": 1, "label": "Low", "max_safe_days": 90, "risk_factor": "Unknown crop"})



def get_available_slots(db: Session, centre_id: int, date: str) -> list[dict]:
    """
    Get all slots for a centre on a date with availability tags.

    Each slot is tagged as:
    - 'full'        → no capacity left
    - 'limited'     → 3 or fewer slots remaining
    - 'recommended' → the emptiest slot (best load ratio)
    - 'open'        → has capacity, normal availability
    """
    slots = (
        db.query(Slot)
        .filter(Slot.centre_id == centre_id, Slot.date == date)
        .order_by(Slot.start_time)
        .all()
    )

    # First pass: find the recommended slot (lowest load ratio with capacity)
    recommended_slot_id = None
    best_availability_ratio = -1.0

    for slot in slots:
        slots_left = slot.max_capacity - slot.booked_count
        if slots_left > 0 and slot.max_capacity > 0:
            ratio = slots_left / slot.max_capacity
            if ratio > best_availability_ratio:
                best_availability_ratio = ratio
                recommended_slot_id = slot.id

    # Second pass: build results with tags
    result = []
    for slot in slots:
        slots_left = slot.max_capacity - slot.booked_count

        if slots_left <= 0:
            tag = "full"
        elif slots_left <= 3:
            tag = "limited"
        elif slot.id == recommended_slot_id:
            tag = "recommended"
        else:
            tag = "open"

        result.append({
            "id": slot.id,
            "centre_id": slot.centre_id,
            "date": slot.date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "display_time": slot.display_time,
            "max_capacity": slot.max_capacity,
            "booked_count": slot.booked_count,
            "slots_left": slots_left,
            "tag": tag,
        })

    return result


def recommend_slot(db: Session, centre_id: int, date: str, farmer_id: str = None) -> Optional[dict]:
    """Recommend the best slot factoring in crop perishability.
    
    High-perishability crops get the EARLIEST available slot.
    Low-perishability crops get the EMPTIEST slot (load balancing).
    """
    slots = (
        db.query(Slot)
        .filter(Slot.centre_id == centre_id, Slot.date == date)
        .order_by(Slot.start_time)
        .all()
    )

    # Determine perishability
    perishability_score = 1
    crop_info = None
    if farmer_id:
        farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
        if farmer and farmer.crop:
            crop_info = get_perishability(farmer.crop)
            perishability_score = crop_info["score"]

    best_slot = None

    if perishability_score >= 3:
        # HIGH perishability: earliest available slot (time priority)
        for slot in slots:  # already sorted by start_time
            if (slot.max_capacity - slot.booked_count) > 0:
                best_slot = slot
                break
    elif perishability_score == 2:
        # MEDIUM perishability: prefer earlier slots but with decent availability
        best_score = -1.0
        for i, slot in enumerate(slots):
            slots_left = slot.max_capacity - slot.booked_count
            if slots_left > 0 and slot.max_capacity > 0:
                availability_ratio = slots_left / slot.max_capacity
                # Weight: 60% earliness + 40% availability
                earliness = 1.0 - (i / max(len(slots), 1))
                combined_score = (0.6 * earliness) + (0.4 * availability_ratio)
                if combined_score > best_score:
                    best_score = combined_score
                    best_slot = slot
    else:
        # LOW perishability: emptiest slot (load balancing)
        best_ratio = -1.0
        for slot in slots:
            slots_left = slot.max_capacity - slot.booked_count
            if slots_left > 0 and slot.max_capacity > 0:
                ratio = slots_left / slot.max_capacity
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_slot = slot

    if best_slot:
        return {
            "id": best_slot.id,
            "start_time": best_slot.start_time,
            "end_time": best_slot.end_time,
            "display_time": best_slot.display_time,
            "slots_left": best_slot.max_capacity - best_slot.booked_count,
            "perishability": crop_info,
            "priority_reason": (
                "Earliest slot — high crop loss risk" if perishability_score >= 3
                else "Balanced time & availability" if perishability_score == 2
                else "Best availability — stable crop"
            ),
        }
    return None


def book_slot(db: Session, farmer_id: str, centre_id: int, slot_id: int) -> dict:
    """
    Book a slot for a farmer. Returns booking with token.

    Steps:
    1. Verify farmer exists (by public farmer_id string)
    2. Verify slot exists and has capacity
    3. Increment slot.booked_count
    4. Generate sequential token (A-XXX)
    5. Create Booking record
    6. Create QueueEntry
    7. Commit and return
    """
    # Look up farmer by their public ID string
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise ValueError(f"Farmer with ID {farmer_id} not found")

    active_booking = (
        db.query(Booking)
        .filter(
            Booking.farmer_id == farmer.id,
            Booking.slot_id == slot_id,
            Booking.status.notin_(["cancelled", "completed"]),
        )
        .first()
    )
    if active_booking:
        raise ValueError(f"Farmer {farmer_id} already has an active booking for this slot")

    slot = db.query(Slot).filter(Slot.id == slot_id, Slot.centre_id == centre_id).first()
    if not slot:
        raise ValueError(f"Slot with ID {slot_id} not found at centre {centre_id}")

    if slot.booked_count >= slot.max_capacity:
        raise ValueError(f"Slot {slot_id} is full")

    # Generate token: count existing bookings for this centre on this date
    existing_count = (
        db.query(func.count(Booking.id))
        .join(Slot, Booking.slot_id == Slot.id)
        .filter(Booking.centre_id == centre_id, Slot.date == slot.date)
        .scalar()
    ) or 0

    token = f"A-{existing_count + 1}"

    # Increment booked count
    slot.booked_count += 1

    # Create booking
    booking = Booking(
        farmer_id=farmer.id,
        centre_id=centre_id,
        slot_id=slot_id,
        token=token,
        status="confirmed",
    )
    db.add(booking)
    db.flush()

    # Create queue entry — position based on existing queue for this centre
    queue_count = (
        db.query(func.count(QueueEntry.id))
        .filter(QueueEntry.centre_id == centre_id)
        .scalar()
    ) or 0

    queue_entry = QueueEntry(
        booking_id=booking.id,
        centre_id=centre_id,
        position=queue_count + 1,
        status="waiting",
    )
    db.add(queue_entry)
    db.commit()

    return {
        "booking_id": booking.id,
        "token": token,
        "status": booking.status,
        "slot_time": slot.display_time,
        "centre_id": centre_id,
        "position": queue_entry.position,
    }
