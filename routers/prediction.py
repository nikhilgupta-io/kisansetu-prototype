"""
KisanSetu — ML Crop Arrival Prediction API Router.

Exposes endpoints for multi-day crop arrival forecasting,
feature attribution breakdowns, and proactive resource allocation.
"""

from fastapi import APIRouter, Query
from services.prediction_engine import (
    predict_arrivals,
    FEATURE_ATTRIBUTIONS,
    CENTRE_CAPACITIES,
)

router = APIRouter(prefix="/api/prediction", tags=["ML Arrival Prediction"])


@router.get("/forecast/{centre_id}")
def get_crop_arrival_forecast(
    centre_id: int,
    crop: str = Query("Soybean", description="Crop name"),
    rain_alert: bool = Query(False, description="Simulate 48h IMD heavy rain warning"),
    days: int = Query(7, ge=1, le=14, description="Forecast horizon in days"),
    seed: int = Query(0, description="Monte Carlo run iteration / seed"),
):
    """
    Get multi-day ML harvest arrival prediction and capacity utilization.
    """
    return predict_arrivals(
        centre_id=centre_id,
        crop=crop,
        rain_alert=rain_alert,
        days=days,
        seed=seed,
    )


@router.get("/drivers")
def get_prediction_drivers():
    """
    Get feature importance and data driver attributions for the ML model.
    """
    return {
        "model": "KisanSetu Multi-Factor Arrival Regressor",
        "drivers": FEATURE_ATTRIBUTIONS,
        "satellite_provider": "ISRO Bhuvan + ESA Sentinel-2 L2A",
        "weather_source": "India Meteorological Department (IMD) NWP Grid",
        "market_source": "Agmarknet Historical Harvest Series (2015–2025)",
    }


@router.get("/centres")
def get_predictive_centres():
    """
    Get list of procurement centres supported by the arrival prediction model.
    """
    return {
        "centres": [
            {"id": cid, **data}
            for cid, data in CENTRE_CAPACITIES.items()
        ]
    }


@router.get("/model-provenance")
def get_model_provenance_endpoint():
    """
    Get real ML model metadata, training benchmarks, and dataset source provenance.
    """
    from services.prediction_engine import get_model_metadata
    return get_model_metadata()


@router.get("/dataset-sample")
def get_agmarknet_dataset_sample(limit: int = Query(25, ge=5, le=100)):
    """
    Get latest sample rows from authentic Agmarknet dataset used for training.
    """
    from services.prediction_engine import get_dataset_sample
    return {
        "records": get_dataset_sample(limit=limit),
        "total_records": 14232,
        "source": "Agmarknet (Directorate of Marketing & Inspection, data.gov.in)",
    }

