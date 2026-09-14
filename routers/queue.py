"""
KisanSetu — Live queue API endpoints.

Provides real-time queue state for both farmer and mandi views.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Centre, QueueEntry, Booking
from services.queue_manager import get_queue_state, advance_queue, get_position_ahead, estimate_wait_time

router = APIRouter(prefix="/api/queue", tags=["Queue"])


@router.get("/{centre_id}")
def get_live_queue(centre_id: int, db: Session = Depends(get_db)):
    """
    Get the live queue state for a centre.

    Returns current token, all entries, counts, and wait estimates.
    Used by both farmer queue view and mandi staff console.
    """
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    from services.queue_manager import reorder_queue_by_priority, reset_demo_queue
    from models import Farmer

    # Ensure queue is sorted with priority
    reorder_queue_by_priority(db, centre_id)
    state = get_queue_state(db, centre_id)

    # Enrich entries with token, farmer name, crop, and perishability info
    entries = []
    for entry in state["entries"]:
        booking = db.query(Booking).filter(Booking.id == entry.booking_id).first()
        farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first() if booking else None
        perishability_score = farmer.perishability_score if farmer else 1
        entries.append({
            "id": entry.id,
            "booking_id": entry.booking_id,
            "token": booking.token if booking else "?",
            "farmer_name": farmer.name if farmer else "",
            "crop": farmer.crop if farmer else "",
            "perishability_score": perishability_score,
            "priority_label": (
                "High Priority (Perishable)" if perishability_score >= 3
                else "Medium Priority" if perishability_score == 2
                else "Normal Queue"
            ),
            "position": entry.position,
            "status": entry.status,
        })

    return {
        "centre_id": centre_id,
        "centre_name": centre.name,
        "current_token": state["current_token"],
        "entries": entries,
        "waiting_count": state["waiting_count"],
        "processing_count": state["processing_count"],
        "completed_count": state["completed_count"],
    }


@router.post("/reset/{centre_id}")
def reset_queue(centre_id: int, db: Session = Depends(get_db)):
    """Reset the demo queue for a centre to its initial state."""
    from services.queue_manager import reset_demo_queue
    result = reset_demo_queue(db, centre_id)
    return {"success": True, "state": result}


@router.post("/advance/{centre_id}")
def advance(centre_id: int, db: Session = Depends(get_db)):
    """
    Advance the queue: finish current, call next farmer.

    Called by mandi staff when a farmer's procurement is done
    or when calling the next farmer.
    """
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    result = advance_queue(db, centre_id)
    return {
        "success": True,
        "current_token": result["current_token"],
        "waiting_count": result["waiting_count"],
        "completed_count": result["completed_count"],
    }


@router.get("/{centre_id}/farmer/{farmer_id}")
def get_farmer_queue_position(centre_id: int, farmer_id: str, db: Session = Depends(get_db)):
    """
    Get a specific farmer's position and wait estimate in the queue.

    Used by the farmer app to show personalized queue info.
    """
    from models import Farmer

    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    booking = (
        db.query(Booking)
        .filter(
            Booking.farmer_id == farmer.id,
            Booking.centre_id == centre_id,
            Booking.status == "confirmed",
        )
        .order_by(Booking.booked_at.desc())
        .first()
    )

    if not booking:
        raise HTTPException(status_code=404, detail="No active booking found")

    ahead = get_position_ahead(db, centre_id, booking.id)
    wait = estimate_wait_time(db, centre_id, booking.id)

    # Get current token
    state = get_queue_state(db, centre_id)

    return {
        "farmer_token": booking.token,
        "current_token": state["current_token"],
        "position_ahead": ahead,
        "estimated_wait_min": wait,
        "your_turn": ahead == 0,
    }

