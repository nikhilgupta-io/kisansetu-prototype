"""
KisanSetu — Farmer-facing API endpoints.

Provides dashboard data, booking info, and farmer profile for the
vernacular mobile interface.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Farmer, Booking, Slot, Centre, QueueEntry, Procurement, Payment
from services.queue_manager import get_position_ahead, estimate_wait_time

router = APIRouter(prefix="/api/farmer", tags=["Farmer"])


@router.get("/{farmer_id}")
def get_farmer_profile(farmer_id: str, db: Session = Depends(get_db)):
    """Get farmer profile by their public ID (e.g. FR-98213)."""
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    return {
        "id": farmer.id,
        "farmer_id": farmer.farmer_id,
        "name": farmer.name,
        "name_hi": farmer.name_hi,
        "phone": farmer.phone,
        "crop": farmer.crop,
        "crop_hi": farmer.crop_hi,
        "quantity_quintals": farmer.quantity_quintals,
    }


@router.get("/{farmer_id}/dashboard")
def get_farmer_dashboard(farmer_id: str, db: Session = Depends(get_db)):
    """
    Farmer dashboard: next booking, token, queue position, estimated wait.

    This is the primary endpoint the farmer mobile UI calls on load.
    """
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # Find the latest active booking (confirmed, not cancelled/completed)
    booking = (
        db.query(Booking)
        .filter(Booking.farmer_id == farmer.id, Booking.status == "confirmed")
        .order_by(Booking.booked_at.desc())
        .first()
    )

    if not booking:
        return {
            "farmer": {
                "id": farmer.id,
                "farmer_id": farmer.farmer_id,
                "name": farmer.name,
                "name_hi": farmer.name_hi,
                "crop": farmer.crop,
                "crop_hi": farmer.crop_hi,
                "quantity_quintals": farmer.quantity_quintals,
            },
            "next_booking": None,
            "slot": None,
            "centre": None,
            "token": None,
            "estimated_wait_min": None,
            "queue_position": None,
            "procurement_done": False,
        }

    slot = db.query(Slot).filter(Slot.id == booking.slot_id).first()
    centre = db.query(Centre).filter(Centre.id == booking.centre_id).first()

    # Queue info
    position_ahead = get_position_ahead(db, booking.centre_id, booking.id)
    wait_min = estimate_wait_time(db, booking.centre_id, booking.id)

    # Check if procurement is completed for this booking
    procurement = (
        db.query(Procurement)
        .filter(Procurement.booking_id == booking.id)
        .first()
    )
    procurement_done = procurement is not None and procurement.status == "completed"

    # Check payment status
    payment_status = None
    if procurement:
        payment = (
            db.query(Payment)
            .filter(Payment.procurement_id == procurement.id)
            .first()
        )
        if payment:
            payment_status = payment.status

    return {
        "farmer": {
            "id": farmer.id,
            "farmer_id": farmer.farmer_id,
            "name": farmer.name,
            "name_hi": farmer.name_hi,
            "crop": farmer.crop,
            "crop_hi": farmer.crop_hi,
            "quantity_quintals": farmer.quantity_quintals,
        },
        "next_booking": {
            "id": booking.id,
            "token": booking.token,
            "status": booking.status,
            "booked_at": str(booking.booked_at),
        },
        "slot": {
            "id": slot.id,
            "date": slot.date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "display_time": slot.display_time,
        } if slot else None,
        "centre": {
            "id": centre.id,
            "name": centre.name,
            "name_hi": centre.name_hi,
        } if centre else None,
        "token": booking.token,
        "estimated_wait_min": wait_min,
        "queue_position": position_ahead,
        "procurement_done": procurement_done,
        "payment_status": payment_status,
    }


@router.get("/{farmer_id}/status")
def get_procurement_status(farmer_id: str, db: Session = Depends(get_db)):
    """
    Get the full procurement status timeline for a farmer's latest booking.
    Returns each stage with completion status.
    """
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # Get latest booking (any status)
    booking = (
        db.query(Booking)
        .filter(Booking.farmer_id == farmer.id)
        .order_by(Booking.booked_at.desc())
        .first()
    )

    if not booking:
        return {"timeline": [], "details": None}

    slot = db.query(Slot).filter(Slot.id == booking.slot_id).first()
    centre = db.query(Centre).filter(Centre.id == booking.centre_id).first()

    # Queue entry
    queue_entry = (
        db.query(QueueEntry)
        .filter(QueueEntry.booking_id == booking.id)
        .first()
    )

    # Procurement record
    procurement = (
        db.query(Procurement)
        .filter(Procurement.booking_id == booking.id)
        .first()
    )

    # Payment record
    payment = None
    if procurement:
        payment = (
            db.query(Payment)
            .filter(Payment.procurement_id == procurement.id)
            .first()
        )

    # Build timeline
    timeline = []

    # 1. Slot Booked
    timeline.append({
        "label": "Slot Booked",
        "sub": str(booking.booked_at) if booking.booked_at else "",
        "state": "done",
    })

    # 2. Arrived at Centre
    arrived = queue_entry and queue_entry.status in ("called", "processing", "done")
    timeline.append({
        "label": "Arrived at Centre",
        "sub": str(queue_entry.called_at) if queue_entry and queue_entry.called_at else "",
        "state": "done" if arrived else "pending",
    })

    # 3. Token Called
    called = queue_entry and queue_entry.status in ("processing", "done")
    timeline.append({
        "label": "Token Called",
        "sub": str(queue_entry.called_at) if called and queue_entry.called_at else "",
        "state": "done" if called else ("current" if arrived else "pending"),
    })

    # 4. Procurement
    proc_done = procurement and procurement.status == "completed"
    proc_in_progress = procurement and procurement.status == "in_progress"
    timeline.append({
        "label": "Procurement",
        "sub": "Completed" if proc_done else ("In Progress" if proc_in_progress else "Pending"),
        "state": "done" if proc_done else ("current" if proc_in_progress or called else "pending"),
    })

    # 5. Payment Processing
    pay_done = payment and payment.status == "completed"
    pay_processing = payment and payment.status in ("processing", "pending")
    timeline.append({
        "label": "Payment Processing",
        "sub": "In progress" if pay_processing else ("Completed" if pay_done else ""),
        "state": "done" if pay_done else ("current" if proc_done else "pending"),
    })

    # 6. Payment Completed
    timeline.append({
        "label": "Payment Completed",
        "sub": str(payment.completed_at) if pay_done and payment.completed_at else "",
        "state": "done" if pay_done else "pending",
    })

    # Build details
    details = {
        "crop": farmer.crop,
        "quantity": f"{procurement.actual_weight} Quintal" if procurement else f"{farmer.quantity_quintals} Quintal",
        "rate": f"₹{procurement.rate_per_quintal:,.0f} / Quintal" if procurement else None,
        "value": f"₹{procurement.total_value:,.2f}" if procurement else None,
        "status": procurement.status if procurement else "pending",
    }

    return {
        "timeline": timeline,
        "details": details,
        "centre_name": centre.name if centre else None,
        "slot_date": slot.date if slot else None,
        "slot_time": slot.display_time if slot else None,
    }

