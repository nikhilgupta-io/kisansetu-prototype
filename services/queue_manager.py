"""
KisanSetu — Queue Manager Service.

Maintains per-centre FIFO queues, estimates wait times,
and handles queue advancement when mandi staff calls the next farmer.
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Booking, QueueEntry, Farmer, Procurement, Slot
from services.notification import send_token_called

# Average processing time per farmer (minutes) — configurable
AVG_PROCESSING_TIME = 4


def get_queue_state(db: Session, centre_id: int) -> dict[str, Any]:
    """
    Get current queue state for a centre.

    Returns:
        current_token: the token being processed or next to be called
        entries: all queue entry ORM objects ordered by position
        waiting_count, processing_count, completed_count
    """
    entries = (
        db.query(QueueEntry)
        .filter(QueueEntry.centre_id == centre_id)
        .order_by(QueueEntry.position)
        .all()
    )

    current_token = None
    waiting_count = 0
    processing_count = 0
    completed_count = 0

    for entry in entries:
        # Determine current token: first processing or called
        if entry.status in ("processing", "called") and current_token is None:
            booking = db.query(Booking).filter(Booking.id == entry.booking_id).first()
            current_token = booking.token if booking else None

        if entry.status in ("processing", "called"):
            processing_count += 1
        elif entry.status == "waiting":
            waiting_count += 1
        elif entry.status == "done":
            completed_count += 1

    # If no one is actively processing, peek at the first waiting farmer
    if current_token is None:
        for entry in entries:
            if entry.status == "waiting":
                booking = db.query(Booking).filter(Booking.id == entry.booking_id).first()
                current_token = booking.token if booking else None
                break

    return {
        "current_token": current_token,
        "entries": entries,          # ORM objects — callers enrich them
        "waiting_count": waiting_count,
        "processing_count": processing_count,
        "completed_count": completed_count,
    }


def get_position_ahead(db: Session, centre_id: int, booking_id: int) -> int:
    """How many farmers are ahead of a given booking in the queue."""
    entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.centre_id == centre_id, QueueEntry.booking_id == booking_id)
        .first()
    )
    if not entry:
        return 0

    count = (
        db.query(func.count(QueueEntry.id))
        .filter(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status.in_(["waiting", "called"]),
            QueueEntry.position < entry.position,
        )
        .scalar()
    ) or 0

    return count


def estimate_wait_time(db: Session, centre_id: int, booking_id: int) -> int:
    """Estimate wait time in minutes for a booking."""
    ahead = get_position_ahead(db, centre_id, booking_id)
    return ahead * AVG_PROCESSING_TIME


def advance_queue(db: Session, centre_id: int) -> dict[str, Any]:
    """
    Advance to the next farmer in the queue:
    1. Mark any currently active 'processing' or 'called' entry as 'done'
    2. Reorder waiting entries by perishability priority
    3. Promote the top 'waiting' entry to 'processing'
    4. Send SMS notification to that farmer that their token has been called
    """
    now = datetime.now(timezone.utc)

    # 1. Complete whatever was currently active
    active_entries = (
        db.query(QueueEntry)
        .filter(QueueEntry.centre_id == centre_id, QueueEntry.status.in_(["processing", "called"]))
        .all()
    )
    for active in active_entries:
        active.status = "done"
        active.completed_at = now

    # Ensure queue is prioritized before picking next
    reorder_queue_by_priority(db, centre_id)

    # 2. Call the next waiting farmer (highest priority / lowest position)
    next_waiting = (
        db.query(QueueEntry)
        .filter(QueueEntry.centre_id == centre_id, QueueEntry.status == "waiting")
        .order_by(QueueEntry.position.asc())
        .first()
    )
    if next_waiting:
        next_waiting.status = "processing"
        next_waiting.called_at = now

        # Send token called notification
        booking = db.query(Booking).filter(Booking.id == next_waiting.booking_id).first()
        if booking:
            farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
            if farmer and farmer.phone:
                send_token_called(farmer.phone, booking.token, language="hi")
    else:
        # Auto-replenish continuous demo queue so the queue never dead-ends or gets stuck during testing/demo
        last_booking = (
            db.query(Booking)
            .filter(Booking.centre_id == centre_id)
            .order_by(Booking.id.desc())
            .first()
        )
        next_num = 129
        if last_booking and last_booking.token and last_booking.token.startswith("A-"):
            try:
                next_num = max(int(last_booking.token.split("-")[1]) + 1, 129)
            except Exception:
                next_num = 129

        DEMO_POOL = [
            {"name": "Vikram Patel", "name_hi": "विक्रम पटेल", "crop": "Soybean", "crop_hi": "सोयाबीन", "qty": 42.0, "score": 3, "phone": "+919876543220"},
            {"name": "Anita Bai", "name_hi": "अनीता बाई", "crop": "Mustard", "crop_hi": "सरसों", "qty": 35.0, "score": 3, "phone": "+919876543221"},
            {"name": "Kailash Verma", "name_hi": "कैलाश वर्मा", "crop": "Paddy", "crop_hi": "धान", "qty": 55.0, "score": 2, "phone": "+919876543222"},
            {"name": "Sunita Sharma", "name_hi": "सुनीता शर्मा", "crop": "Wheat", "crop_hi": "गेहूं", "qty": 60.0, "score": 1, "phone": "+919876543223"},
            {"name": "Harish Meena", "name_hi": "हरीश मीणा", "crop": "Maize", "crop_hi": "मक्का", "qty": 48.0, "score": 2, "phone": "+919876543224"},
            {"name": "Gopal Das", "name_hi": "गोपाल दास", "crop": "Wheat", "crop_hi": "गेहूं", "qty": 52.0, "score": 1, "phone": "+919876543225"},
        ]
        slot = db.query(Slot).filter(Slot.centre_id == centre_id).order_by(Slot.id.desc()).first()
        slot_id = slot.id if slot else 1

        # 1. Create farmer & booking for active called entry
        p_idx = (next_num - 129) % len(DEMO_POOL)
        f_data = DEMO_POOL[p_idx]
        fid_str = f"FR-DEMO-{next_num}"
        demo_farmer = db.query(Farmer).filter(Farmer.farmer_id == fid_str).first()
        if not demo_farmer:
            demo_farmer = Farmer(
                farmer_id=fid_str,
                name=f_data["name"],
                name_hi=f_data["name_hi"],
                phone=f_data["phone"],
                crop=f_data["crop"],
                crop_hi=f_data["crop_hi"],
                quantity_quintals=f_data["qty"],
                perishability_score=f_data["score"],
            )
            db.add(demo_farmer)
            db.flush()

        active_booking = Booking(
            farmer_id=demo_farmer.id,
            slot_id=slot_id,
            centre_id=centre_id,
            token=f"A-{next_num}",
            status="confirmed",
            booked_at=now,
        )
        db.add(active_booking)
        db.flush()

        new_entry = QueueEntry(
            centre_id=centre_id,
            booking_id=active_booking.id,
            position=1,
            status="processing",
            called_at=now,
        )
        db.add(new_entry)

        # 2. Also seed 3 upcoming waiting entries so the line stays populated
        for offset in range(1, 4):
            up_num = next_num + offset
            up_idx = (up_num - 129) % len(DEMO_POOL)
            up_data = DEMO_POOL[up_idx]
            up_fid = f"FR-DEMO-{up_num}"
            up_farmer = db.query(Farmer).filter(Farmer.farmer_id == up_fid).first()
            if not up_farmer:
                up_farmer = Farmer(
                    farmer_id=up_fid,
                    name=up_data["name"],
                    name_hi=up_data["name_hi"],
                    phone=up_data["phone"],
                    crop=up_data["crop"],
                    crop_hi=up_data["crop_hi"],
                    quantity_quintals=up_data["qty"],
                    perishability_score=up_data["score"],
                )
                db.add(up_farmer)
                db.flush()

            up_booking = Booking(
                farmer_id=up_farmer.id,
                slot_id=slot_id,
                centre_id=centre_id,
                token=f"A-{up_num}",
                status="confirmed",
                booked_at=now,
            )
            db.add(up_booking)
            db.flush()

            db.add(QueueEntry(
                centre_id=centre_id,
                booking_id=up_booking.id,
                position=1 + offset,
                status="waiting",
            ))

        db.flush()
        reorder_queue_by_priority(db, centre_id)
        if demo_farmer.phone:
            send_token_called(demo_farmer.phone, active_booking.token, language="hi")

    db.commit()

    # Return refreshed state
    state = get_queue_state(db, centre_id)
    return {
        "current_token": state["current_token"],
        "waiting_count": state["waiting_count"],
        "processing_count": state["processing_count"],
        "completed_count": state["completed_count"],
    }


def reorder_queue_by_priority(db: Session, centre_id: int):
    """
    Reorder waiting queue entries so that high-perishability crops
    are prioritized ahead of lower-perishability crops, while ALL waiting
    farmers remain in the queue (FIFO within the same perishability tier).
    
    Active 'processing' or 'called' entries remain at position 1.
    """
    # 1. Active entries keep position 1, 2, ...
    active_entries = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status.in_(["processing", "called"]),
        )
        .order_by(QueueEntry.position.asc())
        .all()
    )
    
    current_pos = 1
    for ae in active_entries:
        ae.position = current_pos
        current_pos += 1

    # 2. Get all waiting entries
    waiting_entries = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status == "waiting",
        )
        .all()
    )

    if not waiting_entries:
        db.commit()
        return

    # Fetch farmer perishability score for each waiting entry
    annotated = []
    for entry in waiting_entries:
        booking = db.query(Booking).filter(Booking.id == entry.booking_id).first()
        perishability_score = 1
        booked_at = booking.booked_at if booking and booking.booked_at else None
        booking_id = entry.booking_id
        if booked_at:
            if hasattr(booked_at, "tzinfo") and booked_at.tzinfo is not None:
                booked_ts = booked_at.timestamp()
            elif hasattr(booked_at, "timestamp"):
                booked_ts = booked_at.replace(tzinfo=timezone.utc).timestamp()
            else:
                booked_ts = 0.0
        else:
            booked_ts = 0.0

        if booking:
            farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
            if farmer and farmer.perishability_score:
                perishability_score = farmer.perishability_score
        annotated.append((entry, perishability_score, booked_ts, booking_id))

    # Sort:
    # 1st key: -perishability_score (3=High > 2=Medium > 1=Low)
    # 2nd key: booked_ts (earliest first)
    # 3rd key: booking_id
    annotated.sort(key=lambda x: (-x[1], x[2], x[3]))

    # Assign sequential positions
    for entry, score, _, _ in annotated:
        entry.position = current_pos
        current_pos += 1

    db.commit()


def reset_demo_queue(db: Session, centre_id: int = 1) -> dict[str, Any]:
    """
    Reset demo queue to initial clean state for Sehore centre:
    - A-123 (Prakash Sharma, Wheat) -> processing (pos 1)
    - A-124 (Suresh Kumar, Wheat) -> waiting
    - A-125 (Mohan Singh, Paddy) -> waiting
    - A-126 (Ravi Patel, Wheat) -> waiting
    - A-127 (Ram Lal, Wheat) -> waiting
    - A-128 (Dinesh Yadav, Soybean) -> waiting (prioritized to pos 2 ahead of wheat!)
    """
    now = datetime.now(timezone.utc)

    # Clear existing queue entries for this centre
    db.query(QueueEntry).filter(QueueEntry.centre_id == centre_id).delete()

    # Clean up non-base bookings (> A-128)
    base_tokens = ["A-123", "A-124", "A-125", "A-126", "A-127", "A-128"]
    extra_bookings = (
        db.query(Booking)
        .filter(Booking.centre_id == centre_id, Booking.token.notin_(base_tokens))
        .all()
    )
    for eb in extra_bookings:
        db.query(Procurement).filter(Procurement.booking_id == eb.id).delete(synchronize_session=False)
        db.delete(eb)
    db.flush()

    # Reset base bookings for centre 1
    bookings = db.query(Booking).filter(Booking.centre_id == centre_id).all()
    for b in bookings:
        b.status = "confirmed"

    token_map = {b.token: b for b in bookings}

    # Active: A-123
    if "A-123" in token_map:
        db.add(QueueEntry(
            centre_id=centre_id,
            booking_id=token_map["A-123"].id,
            position=1,
            status="processing",
            called_at=now,
        ))

    # Waiting tokens
    waiting_tokens = ["A-124", "A-125", "A-126", "A-127", "A-128"]
    for t in waiting_tokens:
        if t in token_map:
            db.add(QueueEntry(
                centre_id=centre_id,
                booking_id=token_map[t].id,
                position=999,
                status="waiting",
            ))

    db.flush()
    reorder_queue_by_priority(db, centre_id)
    db.commit()

    return get_queue_state(db, centre_id)


def call_specific_token(db: Session, centre_id: int, booking_id: int) -> dict[str, Any]:
    """Call a specific farmer's token."""
    entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.centre_id == centre_id, QueueEntry.booking_id == booking_id)
        .first()
    )
    if entry:
        entry.status = "called"
        entry.called_at = datetime.now(timezone.utc)
        db.commit()

    state = get_queue_state(db, centre_id)
    return {
        "current_token": state["current_token"],
        "waiting_count": state["waiting_count"],
        "completed_count": state["completed_count"],
    }
