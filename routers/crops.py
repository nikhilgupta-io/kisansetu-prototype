"""KisanSetu — Crop perishability data endpoint."""

from fastapi import APIRouter
from services.slot_engine import CROP_PERISHABILITY

router = APIRouter(prefix="/api/crops", tags=["Crops"])


@router.get("/perishability")
def list_crop_perishability():
    """Return crop perishability index for all known crops."""
    return {
        "crops": [
            {"name": name, **info}
            for name, info in sorted(CROP_PERISHABILITY.items(), key=lambda x: -x[1]["score"])
        ]
    }
