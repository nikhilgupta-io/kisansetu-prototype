"""
KisanSetu — Smart Slot Allocation API endpoints.

Demand vs capacity analysis, imbalance detection, and
automated redistribution recommendations for the admin panel.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Centre
from services.allocation_engine import (
    get_demand_capacity,
    detect_imbalances,
    apply_redistribution,
)

router = APIRouter(prefix="/api/allocation", tags=["Allocation"])


class ApplyRedistributionRequest(BaseModel):
    """Request to apply a redistribution recommendation."""
    source_centre_id: int
    target_centre_id: int
    move_count: int
    date: str  # ISO date string


@router.get("/demand/{centre_id}")
def get_demand(centre_id: int, date: str = "2026-09-12", db: Session = Depends(get_db)):
    """
    Get hourly demand vs capacity data for a centre.

    Used by the admin allocation chart (BarChart in the frontend).
    Returns array of {hour, demand, capacity} points.
    """
    centre = db.query(Centre).filter(Centre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    data = get_demand_capacity(db, centre_id, date)
    return {
        "centre_id": centre_id,
        "centre_name": centre.name,
        "date": date,
        "data": data,
    }


@router.get("/imbalance")
def get_imbalances(date: str = "2026-09-12", db: Session = Depends(get_db)):
    """
    Detect centres with demand exceeding capacity.

    Returns a list of imbalance records with redistribution
    recommendations (e.g. "Move 28 appointments Vidisha → Bhopal").
    """
    imbalances = detect_imbalances(db, date)
    return {
        "date": date,
        "has_imbalance": len(imbalances) > 0,
        "imbalances": imbalances,
    }


@router.post("/apply")
def apply_allocation(request: ApplyRedistributionRequest, db: Session = Depends(get_db)):
    """
    Apply a redistribution recommendation.

    Moves appointments from the overloaded source centre
    to the underloaded target centre.
    """
    try:
        result = apply_redistribution(
            db,
            source_centre_id=request.source_centre_id,
            target_centre_id=request.target_centre_id,
            move_count=request.move_count,
            date=request.date,
        )
        return {"success": True, "result": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))