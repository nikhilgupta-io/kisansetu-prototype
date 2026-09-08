"""
KisanSetu — Offline Sync Endpoints.

Accepts batched offline transactions from the frontend
when connectivity is restored. Uses idempotency keys (UUIDs)
to prevent duplicate processing.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Booking, QueueEntry, Procurement, Payment, Farmer

logger = logging.getLogger("kisansetu.sync")

router = APIRouter(prefix="/api/sync", tags=["Sync"])


class SyncAction(BaseModel):
    """A single offline action to be synced."""
    id: str                     # UUID — idempotency key
    action: str                 # Action type: COMPLETE_PROCUREMENT, ADVANCE_QUEUE, etc.
    timestamp: str              # ISO timestamp when the action was performed offline
    data: dict                  # Action-specific payload


class SyncBatchRequest(BaseModel):
    """Batch of offline actions to sync."""
    actions: list[SyncAction]


# Track processed idempotency keys in memory (for prototype; use Redis in production)
_processed_ids: set[str] = set()


@router.post("/batch")
def sync_batch(request: SyncBatchRequest, db: Session = Depends(get_db)):
    """
    Process a batch of offline actions.
    
    Each action is identified by a UUID. Already-processed UUIDs are
    skipped (idempotency). Actions are applied in timestamp order.
    """
    # Sort by timestamp to apply in chronological order
    sorted_actions = sorted(request.actions, key=lambda a: a.timestamp)
    
    synced = 0
    skipped = 0
    failed = 0
    results = []
    
    for action in sorted_actions:
        # Idempotency check
        if action.id in _processed_ids:
            skipped += 1
            results.append({"id": action.id, "status": "skipped", "reason": "already_processed"})
            continue
        
        try:
            result = _process_action(db, action)
            _processed_ids.add(action.id)
            synced += 1
            results.append({"id": action.id, "status": "synced", "result": result})
        except Exception as e:
            failed += 1
            results.append({"id": action.id, "status": "failed", "error": str(e)})
            logger.error(f"Sync failed for action {action.id}: {e}")
    
    return {
        "synced": synced,
        "skipped": skipped,
        "failed": failed,
        "total": len(sorted_actions),
        "results": results,
    }


def _process_action(db: Session, action: SyncAction) -> dict:
    """Process a single offline action."""
    now = datetime.now(timezone.utc)
    
    if action.action == "COMPLETE_PROCUREMENT":
        booking_id = action.data.get("booking_id")
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found")
        
        # Create/update procurement
        procurement = db.query(Procurement).filter(Procurement.booking_id == booking_id).first()
        if not procurement:
            procurement = Procurement(booking_id=booking_id)
            db.add(procurement)
        
        total_value = action.data.get("actual_weight", 0) * action.data.get("rate_per_quintal", 0)
        procurement.actual_weight = action.data.get("actual_weight", 0)
        procurement.quality_grade = action.data.get("quality_grade", "")
        procurement.rate_per_quintal = action.data.get("rate_per_quintal", 0)
        procurement.total_value = total_value
        procurement.status = "completed"
        procurement.completed_at = now
        db.flush()
        
        # Create payment
        existing_payment = db.query(Payment).filter(Payment.procurement_id == procurement.id).first()
        if not existing_payment:
            payment = Payment(
                procurement_id=procurement.id,
                amount=total_value,
                status="processing",
                initiated_at=now,
            )
            db.add(payment)
        
        booking.status = "completed"
        
        queue_entry = db.query(QueueEntry).filter(QueueEntry.booking_id == booking_id).first()
        if queue_entry:
            queue_entry.status = "done"
            queue_entry.completed_at = now
        
        db.commit()
        return {"procurement_id": procurement.id, "total_value": total_value}
    
    elif action.action == "ADVANCE_QUEUE":
        from services.queue_manager import advance_queue
        centre_id = action.data.get("centre_id", 1)
        result = advance_queue(db, centre_id)
        return {"current_token": result.get("current_token")}
    
    elif action.action == "START_PROCESSING":
        booking_id = action.data.get("booking_id")
        queue_entry = db.query(QueueEntry).filter(QueueEntry.booking_id == booking_id).first()
        if queue_entry:
            queue_entry.status = "processing"
            queue_entry.called_at = now
        db.commit()
        return {"booking_id": booking_id}
    
    else:
        raise ValueError(f"Unknown action type: {action.action}")


@router.get("/status")
def sync_status():
    """Check sync service status and number of processed actions."""
    return {
        "status": "ok",
        "processed_count": len(_processed_ids),
    }
