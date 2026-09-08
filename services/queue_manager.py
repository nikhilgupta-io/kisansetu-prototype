"""
KisanSetu — Queue Manager Service.

Maintains per-centre FIFO queues, estimates wait times,
and handles queue advancement when mandi staff calls the next farmer.
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Booking, QueueEntry, Farmer
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
    2. Promote the next 'waiting' entry to 'processing'
    3. Send SMS notification to that farmer that their token has been called
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

    # 2. Call the next waiting farmer
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

    db.commit()

    # Return refreshed state
    state = get_queue_state(db, centre_id)
    return {
        "current_token": state["current_token"],
        "waiting_count": state["waiting_count"],
        "processing_count": state["processing_count"],
        "completed_count": state["completed_count"],
    }


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
