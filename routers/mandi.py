"""
KisanSetu — Mandi staff API endpoints.

Fast-logging console: dashboard stats, upcoming queue, farmer
processing, and procurement completion.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Centre, Farmer, Booking, Slot, QueueEntry, Procurement, Payment
from services.queue_manager import get_queue_state
from services.notification import send_payment_notification, send_token_called

router = APIRouter(prefix="/api/mandi", tags=["Mandi Staff"])


class CompleteProcurementRequest(BaseModel):
    """Request body for completing a procurement."""
    actual_weight: float
    quality_grade: str          # A / B / C
    rate_per_quintal: float     # INR


@router.get("/{centre_id}/dashboard")
def mandi_dashboard(centre_id: int, db: Session = Depends(get_db)):
    """
    Mandi staff dashboard: headline stats and current token.

    Provides: total farmers, waiting, processing, completed counts
    plus the currently-called token number.
    """
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    state = get_queue_state(db, centre_id)

    # Total farmers = all bookings for this centre today
    total_farmers = (
        db.query(Booking)
        .filter(Booking.centre_id == centre_id, Booking.status != "cancelled")
        .count()
    )

    return {
        "centre": {
            "id": centre.id,
            "name": centre.name,
            "name_hi": centre.name_hi,
            "status": centre.status,
        },
        "total_farmers": total_farmers,
        "waiting": state["waiting_count"],
        "processing": state["processing_count"],
        "completed": state["completed_count"],
        "current_token": state["current_token"],
    }


@router.get("/{centre_id}/upcoming")
def mandi_upcoming(centre_id: int, db: Session = Depends(get_db)):
    """
    List upcoming farmers in the queue with their details.

    Used by mandi staff to see who is coming next with crop/time info.
    """
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    from services.queue_manager import reorder_queue_by_priority
    reorder_queue_by_priority(db, centre_id)

    # Get waiting + called queue entries, ordered by position
    # Get waiting queue entries, ordered by position (processing farmer is on the counter)
    entries = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status.in_(["waiting", "called", "processing"]),
            QueueEntry.status == "waiting",
        )
        .order_by(QueueEntry.position)
        .limit(15)
        .all()
    )

    upcoming = []
    for entry in entries:
        booking = db.query(Booking).filter(Booking.id == entry.booking_id).first()
        if not booking:
            continue
        farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
        slot = db.query(Slot).filter(Slot.id == booking.slot_id).first()

        perishability_score = farmer.perishability_score if farmer else 1
        priority_label = (
            "High Priority (Perishable)" if perishability_score >= 3
            else "Medium Priority" if perishability_score == 2
            else "Normal Queue"
        )

        upcoming.append({
            "token": booking.token,
            "time": slot.display_time.split(" – ")[0] if slot and slot.display_time else (slot.start_time if slot else ""),
            "crop": farmer.crop if farmer else "",
            "farmer_name": farmer.name if farmer else "",
            "booking_id": booking.id,
            "status": entry.status,
            "position": entry.position,
            "perishability_score": perishability_score,
            "priority_label": priority_label,
        })

    return {"centre_id": centre_id, "upcoming": upcoming}


@router.post("/process/{booking_id}")
def start_processing(booking_id: int, db: Session = Depends(get_db)):
    """
    Mark a farmer as being processed (their token is currently active).

    Called when mandi staff begins weighing/grading the farmer's crop.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Update queue entry to processing
    queue_entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.booking_id == booking_id)
        .first()
    )
    if queue_entry:
        queue_entry.status = "processing"
        queue_entry.called_at = datetime.now(timezone.utc)

    # Create initial procurement record
    existing = db.query(Procurement).filter(Procurement.booking_id == booking_id).first()
    if not existing:
        procurement = Procurement(
            booking_id=booking_id,
            actual_weight=0,
            quality_grade="",
            rate_per_quintal=0,
            total_value=0,
            status="in_progress",
        )
        db.add(procurement)

    db.commit()

    # Send notification to farmer
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
    if farmer and farmer.phone:
        send_token_called(farmer.phone, booking.token)

    return {"success": True, "message": f"Processing started for token {booking.token}"}


@router.post("/complete/{booking_id}")
def complete_procurement(
    booking_id: int,
    request: CompleteProcurementRequest,
    db: Session = Depends(get_db),
):
    """
    Complete procurement for a farmer.

    Records weight, quality grade, rate → auto-calculates total value.
    Creates payment record and initiates payment.
    Updates booking and queue entry status.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    now = datetime.now(timezone.utc)

    # Update or create procurement record
    procurement = db.query(Procurement).filter(Procurement.booking_id == booking_id).first()
    if not procurement:
        procurement = Procurement(booking_id=booking_id)
        db.add(procurement)

    total_value = request.actual_weight * request.rate_per_quintal

    procurement.actual_weight = request.actual_weight
    procurement.quality_grade = request.quality_grade
    procurement.rate_per_quintal = request.rate_per_quintal
    procurement.total_value = total_value
    procurement.status = "completed"
    procurement.completed_at = now
    db.flush()

    # Create payment record
    existing_payment = db.query(Payment).filter(Payment.procurement_id == procurement.id).first()
    if not existing_payment:
        payment = Payment(
            procurement_id=procurement.id,
            amount=total_value,
            status="processing",
            initiated_at=now,
        )
        db.add(payment)

    # Update booking status
    booking.status = "completed"

    # Update queue entry
    queue_entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.booking_id == booking_id)
        .first()
    )
    if queue_entry:
        queue_entry.status = "done"
        queue_entry.completed_at = now

    db.commit()

    # Send payment notification
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
    if farmer and farmer.phone:
        send_payment_notification(farmer.phone, total_value)

    return {
        "success": True,
        "procurement": {
            "actual_weight": procurement.actual_weight,
            "quality_grade": procurement.quality_grade,
            "rate_per_quintal": procurement.rate_per_quintal,
            "total_value": procurement.total_value,
            "status": procurement.status,
        },
        "payment_status": "processing",
    }

