"""
KisanSetu — Admin dashboard API endpoints.

Aggregate stats, centre overview, and regional monitoring
for the admin tracking dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Centre, Booking, QueueEntry
from services.queue_manager import get_queue_state

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/overview")
def admin_overview(db: Session = Depends(get_db)):
    """
    Admin overview: aggregate stats across all centres.

    Returns total farmers, completed, waiting, delayed counts,
    and a list of all centres with their live status.
    """
    centres = db.query(Centre).all()

    total_farmers = db.query(Booking).filter(Booking.status != "cancelled").count()
    completed = db.query(Booking).filter(Booking.status == "completed").count()

    total_waiting = 0
    total_delayed = 0
    centre_data = []

    for centre in centres:
        state = get_queue_state(db, centre.id)

        # "Delayed" = farmers waiting more than expected (queue > capacity threshold)
        delayed = max(0, state["waiting_count"] - centre.capacity_per_hour)
        total_waiting += state["waiting_count"]
        total_delayed += delayed

        # Determine live status based on queue pressure
        queue_pressure = state["waiting_count"]
        if queue_pressure > centre.capacity_per_hour * 0.8:
            live_status = "Critical"
        elif queue_pressure > centre.capacity_per_hour * 0.4:
            live_status = "Busy"
        else:
            live_status = "Normal"

        # Update centre status in DB if changed
        if centre.status != live_status:
            centre.status = live_status

        centre_data.append({
            "id": centre.id,
            "name": centre.name,
            "name_hi": centre.name_hi,
            "queue": state["waiting_count"],
            "capacity": int(
                (state["waiting_count"] + state["processing_count"] + state["completed_count"])
                / max(centre.capacity_per_hour, 1)
                * 100
            ),
            "status": live_status,
            "location_x": centre.location_x,
            "location_y": centre.location_y,
        })

    db.commit()

    return {
        "total_farmers": total_farmers,
        "completed": completed,
        "waiting": total_waiting,
        "delayed": total_delayed,
        "centres": centre_data,
    }


@router.get("/centres")
def list_centres(db: Session = Depends(get_db)):
    """List all procurement centres with their current stats."""
    centres = db.query(Centre).all()
    result = []

    for centre in centres:
        state = get_queue_state(db, centre.id)
        result.append({
            "id": centre.id,
            "name": centre.name,
            "name_hi": centre.name_hi,
            "location_x": centre.location_x,
            "location_y": centre.location_y,
            "capacity_per_hour": centre.capacity_per_hour,
            "status": centre.status,
            "queue": state["waiting_count"],
            "processing": state["processing_count"],
            "completed": state["completed_count"],
        })

    return {"centres": result}


@router.get("/centres/{centre_id}")
def get_centre_detail(centre_id: int, db: Session = Depends(get_db)):
    """Get detailed info for a specific centre."""
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    state = get_queue_state(db, centre.id)

    total_bookings = (
        db.query(Booking)
        .filter(Booking.centre_id == centre_id, Booking.status != "cancelled")
        .count()
    )

    return {
        "id": centre.id,
        "name": centre.name,
        "name_hi": centre.name_hi,
        "location_x": centre.location_x,
        "location_y": centre.location_y,
        "capacity_per_hour": centre.capacity_per_hour,
        "status": centre.status,
        "total_bookings": total_bookings,
        "waiting": state["waiting_count"],
        "processing": state["processing_count"],
        "completed": state["completed_count"],
        "current_token": state["current_token"],
    }

