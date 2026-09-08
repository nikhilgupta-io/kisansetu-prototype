"""
KisanSetu — Slot management API endpoints.

Handles listing available slots, booking, and cancellation.
Uses the SlotEngine service for dynamic recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.slot_engine import get_available_slots, recommend_slot, book_slot

router = APIRouter(prefix="/api/slots", tags=["Slots"])


class BookSlotRequest(BaseModel):
    """Request body for booking a slot."""
    farmer_id: str      # Public farmer ID e.g. "FR-98213"
    centre_id: int
    slot_id: int


@router.get("/{centre_id}/{date}")
def list_slots(centre_id: int, date: str, farmer_id: str = None, db: Session = Depends(get_db)):
    """
    List all slots for a centre on a given date.

    Each slot includes:
    - Basic info (time, capacity)
    - slots_left count
    - tag: 'open', 'limited', 'recommended', or 'full'
    """
    slots = get_available_slots(db, centre_id, date)
    recommended = recommend_slot(db, centre_id, date, farmer_id=farmer_id)

    return {
        "centre_id": centre_id,
        "date": date,
        "slots": slots,
        "recommended_slot_id": recommended["id"] if recommended else None,
        "recommended": recommended,
    }


@router.post("/book")
def book(request: BookSlotRequest, db: Session = Depends(get_db)):
    """
    Book a slot for a farmer.

    Returns the booking confirmation with token number.
    Raises 400 if slot is full or farmer not found.
    """
    try:
        result = book_slot(db, request.farmer_id, request.centre_id, request.slot_id)
        return {
            "success": True,
            "booking": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/book/{booking_id}")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    """Cancel an existing booking."""
    from models import Booking, Slot, QueueEntry

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")

    # Update booking status
    booking.status = "cancelled"

    # Decrement slot booked count
    slot = db.query(Slot).filter(Slot.id == booking.slot_id).first()
    if slot and slot.booked_count > 0:
        slot.booked_count -= 1

    # Remove queue entry
    queue_entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.booking_id == booking.id)
        .first()
    )
    if queue_entry:
        db.delete(queue_entry)

    db.commit()

    return {"success": True, "message": "Booking cancelled"}

