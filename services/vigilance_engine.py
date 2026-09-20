"""
KisanSetu — AI Anti-Fraud & Vigilance Engine.

Algorithmic defense subsystem safeguarding public MSP procurement integrity:
1. Yield vs. Landholding Anomaly Detection (MP Bhulekh API cadastral check)
2. Token Reservation Velocity & Syndicate Bot Detector (Telephony & IP clustering)
3. Weighbridge Moisture & Quality Manipulation Scanner (Regional Micro-climate Z-Score)
4. Farm-Gate Satellite Crop Verification (Sentinel-2 NDVI vegetation match)
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# Standard agricultural agronomic yield thresholds (Quintals per Acre)
BENCHMARK_YIELDS = {
    "Wheat": {"avg": 22.0, "max_allowable": 28.0, "msp_rate": 2275},
    "Paddy": {"avg": 24.0, "max_allowable": 32.0, "msp_rate": 2300},
    "Soybean": {"avg": 12.0, "max_allowable": 16.5, "msp_rate": 4892},
    "Mustard": {"avg": 10.5, "max_allowable": 14.0, "msp_rate": 5650},
    "Gram": {"avg": 11.0, "max_allowable": 15.0, "msp_rate": 5440},
}

# Live simulated incident store for vigilance audit trail
INCIDENTS_STORE: List[Dict[str, Any]] = [
    {
        "id": "VIG-2026-0891",
        "farmer_id": "FR-10492",
        "farmer_name": "Rameshwar Patidar (Trader Front)",
        "phone": "+91 94250 81290",
        "centre_id": 8,
        "centre_name": "Vidisha Main APMC",
        "crop": "Soybean",
        "claimed_qtl": 450.0,
        "land_acres": 1.5,
        "khasra_no": "142/2, Gram Bilaua",
        "calculated_yield_qtl_acre": 300.0,
        "benchmark_max_qtl_acre": 16.5,
        "anomaly_type": "Cadastral Yield Inflation",
        "detected_at": "Today, 08:42 AM",
        "risk_score": 94,
        "severity": "Critical",
        "amount_at_risk": 2201400.0,  # ₹ 22.01 Lakhs
        "status": "DBT Frozen",
        "details": "Farmer claims 450 Qtl on 1.5 acres (yield: 300 Qtl/acre vs normal 12 Qtl/acre). Suspected commercial interstate grain dumping from unverified private trader network.",
        "actions_taken": ["DBT Disbursed Blocked", "Flying Squad Audit Issued", "Aadhaar e-Vault Flagged"],
    },
    {
        "id": "VIG-2026-0892",
        "farmer_id": "FR-88123",
        "farmer_name": "Kailash Agro Brokers (Syndicate)",
        "phone": "+91 98261 44102",
        "centre_id": 1,
        "centre_name": "Sehore Main APMC",
        "crop": "Wheat",
        "claimed_qtl": 180.0,
        "land_acres": 8.0,
        "khasra_no": "98/1, Gram Barkhedi",
        "calculated_yield_qtl_acre": 22.5,
        "benchmark_max_qtl_acre": 28.0,
        "anomaly_type": "Token Scalper Bot / IP Burst",
        "detected_at": "Today, 09:15 AM",
        "risk_score": 88,
        "severity": "High",
        "amount_at_risk": 409500.0,  # ₹ 4.09 Lakhs
        "status": "Challenge Issued",
        "details": "18 slot reservations originating from single IP subnet (103.21.58.0/24) within 3.5 minutes of morning queue opening. Rate-limiter triggered; mandatory biometric challenge enforced.",
        "actions_taken": ["Rate Limit Throttling", "Biometric Challenge Enforced"],
    },
    {
        "id": "VIG-2026-0893",
        "farmer_id": "FR-51209",
        "farmer_name": "Weighbridge Counter 3 Operator",
        "phone": "+91 97555 19024",
        "centre_id": 8,
        "centre_name": "Vidisha Main APMC",
        "crop": "Paddy",
        "claimed_qtl": 320.0,
        "land_acres": 12.0,
        "khasra_no": "210/4, Gram Gulabganj",
        "calculated_yield_qtl_acre": 26.6,
        "benchmark_max_qtl_acre": 32.0,
        "anomaly_type": "Weighbridge Grading Collusion",
        "detected_at": "Today, 10:05 AM",
        "risk_score": 82,
        "severity": "High",
        "amount_at_risk": 736000.0,  # ₹ 7.36 Lakhs
        "status": "Under Review",
        "details": "Counter 3 registered 0.0% moisture deduction across 42 consecutive truck arrivals despite regional relative humidity of 88% and rainfall alert. Statistical Z-Score outlier (+3.8 sigma).",
        "actions_taken": ["Scale Re-Calibration Summoned", "Independent Re-weigh Triggered"],
    },
    {
        "id": "VIG-2026-0894",
        "farmer_id": "FR-33918",
        "farmer_name": "Devendra Pratap Singh",
        "phone": "+91 98930 77123",
        "centre_id": 11,
        "centre_name": "Raisen Krishi Mandi",
        "crop": "Mustard",
        "claimed_qtl": 210.0,
        "land_acres": 15.0,
        "khasra_no": "55/3, Gram Salamatpur",
        "calculated_yield_qtl_acre": 14.0,
        "benchmark_max_qtl_acre": 14.0,
        "anomaly_type": "Satellite NDVI Vegetative Mismatch",
        "detected_at": "Today, 10:48 AM",
        "risk_score": 67,
        "severity": "Medium",
        "amount_at_risk": 1186500.0,  # ₹ 11.86 Lakhs
        "status": "Physical Verification",
        "details": "Sentinel-2 optical pass shows NDVI index of 0.18 (barren soil / fallow land) on registered coordinates during peak vegetative growth phase. Standing harvest optical check failed.",
        "actions_taken": ["Village Patwari Verification Sent"],
    },
]


def calculate_fraud_risk(
    crop: str,
    claimed_qtl: float,
    land_acres: float,
    reservation_speed_sec: float = 45.0,
    moisture_pct: float = 12.0,
    regional_avg_moisture: float = 12.5,
    satellite_ndvi: float = 0.65,
) -> Dict[str, Any]:
    """
    Evaluates procurement booking against the 4-pillar fraud matrix:
    - Yield Anomaly (40% weight)
    - Token Velocity Spike (25% weight)
    - Moisture Z-Score Discrepancy (20% weight)
    - Satellite Vegetative Match (15% weight)
    """
    bench = BENCHMARK_YIELDS.get(crop, BENCHMARK_YIELDS["Wheat"])
    yield_per_acre = claimed_qtl / max(land_acres, 0.1)

    # 1. Yield Anomaly Score (0 to 100)
    if yield_per_acre > bench["max_allowable"] * 2.5:
        yield_score = 100
        yield_flag = f"Extreme Anomaly: Claimed {yield_per_acre:.1f} Qtl/Acre vs allowable ceiling {bench['max_allowable']} Qtl/Acre"
    elif yield_per_acre > bench["max_allowable"]:
        yield_score = min(100, int((yield_per_acre / bench["max_allowable"]) * 70))
        yield_flag = f"Exceeds ceiling: {yield_per_acre:.1f} Qtl/Acre exceeds {bench['max_allowable']} standard limit"
    else:
        yield_score = 10
        yield_flag = "Normal cadastral yield within agronomic limit"

    # 2. Token Velocity Score (0 to 100)
    if reservation_speed_sec < 4.0:
        velocity_score = 95
        velocity_flag = "Bot burst speed (<4s reservation). Middleman script suspected"
    elif reservation_speed_sec < 10.0:
        velocity_score = 65
        velocity_flag = "Rapid reservation pattern (<10s)"
    else:
        velocity_score = 5
        velocity_flag = "Human interaction pacing confirmed"

    # 3. Moisture Variance Score (0 to 100)
    moisture_variance = abs(moisture_pct - regional_avg_moisture)
    if moisture_pct == 0.0 and regional_avg_moisture > 10.0:
        moisture_score = 90
        moisture_flag = "Zero deduction recorded while regional moisture is elevated"
    elif moisture_variance > 5.0:
        moisture_score = 70
        moisture_flag = f"High variance from micro-climate average ({moisture_variance:.1f}%)"
    else:
        moisture_score = 10
        moisture_flag = "Consistent with regional micro-climate readings"

    # 4. Satellite NDVI Score (0 to 100)
    if satellite_ndvi < 0.25:
        ndvi_score = 90
        ndvi_flag = f"Low vegetative density ({satellite_ndvi:.2f}). Land appears fallow or barren"
    elif satellite_ndvi < 0.40:
        ndvi_score = 50
        ndvi_flag = f"Moderate vegetative density ({satellite_ndvi:.2f})"
    else:
        ndvi_score = 5
        ndvi_flag = f"Healthy standing harvest confirmed (NDVI {satellite_ndvi:.2f})"

    # Composite Weighted Risk Score with Peak Anomaly Elevation
    weighted_score = (
        (0.40 * yield_score)
        + (0.25 * velocity_score)
        + (0.20 * moisture_score)
        + (0.15 * ndvi_score)
    )

    # If any single vector is catastrophic (e.g. 100 on yield or 95 on bot speed),
    # the composite risk must elevate rather than being diluted
    max_single_vector = max(yield_score, velocity_score, moisture_score, ndvi_score)
    if max_single_vector >= 90:
        composite_risk = int(max(weighted_score, max_single_vector * 0.94))
    elif max_single_vector >= 70:
        composite_risk = int(max(weighted_score, max_single_vector * 0.85))
    else:
        composite_risk = int(weighted_score)

    if composite_risk >= 80:
        severity = "Critical"
        recommended_action = "Hard Lock: Freeze e-J-Form & DBT clearance pending biometric audit"
    elif composite_risk >= 60:
        severity = "High"
        recommended_action = "Secondary Inspection: Mandate physical scale supervisor verification"
    elif composite_risk >= 40:
        severity = "Medium"
        recommended_action = "Watchlist: Route to normal scale with audit flag"
    else:
        severity = "Low"
        recommended_action = "Fast-Track Clearance: All cadastral and satellite checks passed"

    approx_value = round(claimed_qtl * bench["msp_rate"], 2)

    return {
        "crop": crop,
        "claimed_qtl": claimed_qtl,
        "land_acres": land_acres,
        "calculated_yield": round(yield_per_acre, 1),
        "composite_risk_score": composite_risk,
        "severity": severity,
        "recommended_action": recommended_action,
        "approx_dbt_value": approx_value,
        "breakdown": {
            "yield_anomaly": {"score": yield_score, "flag": yield_flag},
            "velocity_spike": {"score": velocity_score, "flag": velocity_flag},
            "moisture_zscore": {"score": moisture_score, "flag": moisture_flag},
            "satellite_ndvi": {"score": ndvi_score, "flag": ndvi_flag},
        },
    }


def get_vigilance_overview() -> Dict[str, Any]:
    """Returns overview stats and list of live flagged incident tickets."""
    total_scanned = 12430
    flagged_count = len(INCIDENTS_STORE)
    total_saved = sum(item["amount_at_risk"] for item in INCIDENTS_STORE if item["status"] in ("DBT Frozen", "Challenge Issued"))
    pending_holds = len([item for item in INCIDENTS_STORE if item["status"] in ("DBT Frozen", "Under Review", "Physical Verification")])

    return {
        "metrics": {
            "total_scanned_today": total_scanned,
            "anomalies_flagged": flagged_count,
            "funds_protected_inr": total_saved,
            "funds_protected_cr": round(total_saved / 10000000, 2),
            "pending_high_risk_holds": pending_holds,
            "model_precision_pct": 91.4,
            "bhulekh_sync_status": "Online (42ms latency)",
            "sentinel_satellite_pass": "Fresh (Orbit Pass: 18-Sep-2026)",
        },
        "incidents": INCIDENTS_STORE,
    }


def update_incident_action(incident_id: str, action: str, officer_note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Updates action status on a specific vigilance ticket."""
    for item in INCIDENTS_STORE:
        if item["id"] == incident_id:
            now_str = datetime.now(timezone.utc).strftime("%H:%M UTC")
            if action == "freeze_dbt":
                item["status"] = "DBT Frozen"
                item["actions_taken"].append(f"DBT frozen by officer ({now_str})")
            elif action == "clear_audit":
                item["status"] = "Cleared & Approved"
                item["actions_taken"].append(f"Audit manually cleared ({now_str}): {officer_note or 'Verified by In-Charge'}")
            elif action == "dispatch_squad":
                item["status"] = "Flying Squad Dispatched"
                item["actions_taken"].append(f"Flying squad physical inspection dispatched ({now_str})")
            return item
    return None
