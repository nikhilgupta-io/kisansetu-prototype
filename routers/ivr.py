"""
KisanSetu — IVR (Interactive Voice Response) Booking Endpoints.

Simulates a call-booking flow for farmers on basic feature phones.
The flow is a state machine: each step accepts DTMF input and
returns audio prompts + the next expected step.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Farmer, Centre, Slot
from services.slot_engine import book_slot, recommend_slot, CROP_PERISHABILITY
from services.notification import send_booking_confirmation

router = APIRouter(prefix="/api/ivr", tags=["IVR"])


class IVRStepRequest(BaseModel):
    """Request for each step in the IVR flow."""
    session_id: str         # Unique call session ID
    step: str               # Current step name
    input: str = ""         # DTMF digits entered by farmer
    farmer_id: str = ""     # Accumulated farmer ID across steps
    crop_choice: str = ""   # Accumulated crop selection
    centre_id: int = 0      # Selected centre


# Crop menu for the IVR keypad
CROP_MENU = {
    "1": "Wheat",
    "2": "Rice",
    "3": "Paddy",
    "4": "Soybean",
    "5": "Maize",
    "6": "Mustard",
    "7": "Pulses",
}

# Centre menu
CENTRE_MENU = {
    "1": 1,  # Sehore
    "2": 2,  # Vidisha
    "3": 3,  # Bhopal
    "4": 4,  # Raisen
    "5": 5,  # Ujjain
}


@router.post("/step")
def ivr_step(req: IVRStepRequest, db: Session = Depends(get_db)):
    """
    Process one step of the IVR call-booking flow.
    
    Returns:
    - prompt_hi: Hindi audio text
    - prompt_en: English audio text
    - next_step: what step to call next
    - options: available DTMF options (if any)
    - booking: booking result (if flow is complete)
    - error: error message (if any)
    """
    
    # Step 1: WELCOME — ask for language
    if req.step == "welcome":
        return {
            "prompt_hi": "किसानसेतु में आपका स्वागत है। हिंदी के लिए 1 दबाएं। For English press 2.",
            "prompt_en": "Welcome to KisanSetu. Press 1 for Hindi. For English press 2.",
            "next_step": "enter_farmer_id",
            "options": {"1": "Hindi", "2": "English"},
        }
    
    # Step 2: ENTER FARMER ID
    if req.step == "enter_farmer_id":
        return {
            "prompt_hi": "कृपया अपना पंजीकरण क्रमांक दर्ज करें और # दबाएं।",
            "prompt_en": "Please enter your Registration Number followed by #.",
            "next_step": "verify_farmer",
            "input_type": "numeric",
            "example": "98213#",
        }
    
    # Step 3: VERIFY FARMER ID
    if req.step == "verify_farmer":
        fid = req.input.strip().replace("#", "")
        farmer_id_str = f"FR-{fid}"
        farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id_str).first()
        
        if not farmer:
            return {
                "prompt_hi": f"क्रमांक {fid} नहीं मिला। कृपया दोबारा दर्ज करें।",
                "prompt_en": f"Registration number {fid} not found. Please try again.",
                "next_step": "enter_farmer_id",
                "error": "farmer_not_found",
            }
        
        return {
            "prompt_hi": f"नमस्ते {farmer.name_hi or farmer.name}! फसल चुनें: गेहूं - 1, चावल - 2, धान - 3, सोयाबीन - 4, मक्का - 5, सरसों - 6, दाल - 7",
            "prompt_en": f"Namaste {farmer.name}! Select crop: Wheat - 1, Rice - 2, Paddy - 3, Soybean - 4, Maize - 5, Mustard - 6, Pulses - 7",
            "next_step": "select_crop",
            "farmer_id": farmer_id_str,
            "farmer_name": farmer.name,
            "farmer_name_hi": farmer.name_hi,
            "options": {k: v for k, v in CROP_MENU.items()},
        }
    
    # Step 4: SELECT CROP
    if req.step == "select_crop":
        crop = CROP_MENU.get(req.input.strip())
        if not crop:
            return {
                "prompt_hi": "गलत विकल्प। कृपया 1 से 7 के बीच दबाएं।",
                "prompt_en": "Invalid choice. Please press a number between 1 and 7.",
                "next_step": "select_crop",
                "farmer_id": req.farmer_id,
                "error": "invalid_crop",
                "options": {k: v for k, v in CROP_MENU.items()},
            }
        
        return {
            "prompt_hi": f"{crop} चुना गया। केंद्र चुनें: सीहोर - 1, विदिशा - 2, भोपाल - 3, रायसेन - 4, उज्जैन - 5",
            "prompt_en": f"{crop} selected. Choose centre: Sehore - 1, Vidisha - 2, Bhopal - 3, Raisen - 4, Ujjain - 5",
            "next_step": "select_centre",
            "farmer_id": req.farmer_id,
            "crop_choice": crop,
            "options": {"1": "Sehore", "2": "Vidisha", "3": "Bhopal", "4": "Raisen", "5": "Ujjain"},
        }
    
    # Step 5: SELECT CENTRE
    if req.step == "select_centre":
        centre_id = CENTRE_MENU.get(req.input.strip())
        if not centre_id:
            return {
                "prompt_hi": "गलत विकल्प। कृपया 1 से 5 के बीच दबाएं।",
                "prompt_en": "Invalid choice. Please press 1 to 5.",
                "next_step": "select_centre",
                "farmer_id": req.farmer_id,
                "crop_choice": req.crop_choice,
                "error": "invalid_centre",
                "options": {"1": "Sehore", "2": "Vidisha", "3": "Bhopal", "4": "Raisen", "5": "Ujjain"},
            }
        
        centre = db.query(Centre).filter(Centre.id == centre_id).first()
        centre_name = centre.name if centre else f"Centre {centre_id}"
        centre_name_hi = centre.name_hi if centre else centre_name
        
        return {
            "prompt_hi": f"{centre_name_hi} चुना गया। पुष्टि के लिए 1 दबाएं, रद्द करने के लिए 9 दबाएं।",
            "prompt_en": f"{centre_name} selected. Press 1 to confirm booking, 9 to cancel.",
            "next_step": "confirm_booking",
            "farmer_id": req.farmer_id,
            "crop_choice": req.crop_choice,
            "centre_id": centre_id,
            "centre_name": centre_name,
            "options": {"1": "Confirm", "9": "Cancel"},
        }
    
    # Step 6: CONFIRM BOOKING
    if req.step == "confirm_booking":
        if req.input.strip() == "9":
            return {
                "prompt_hi": "बुकिंग रद्द। धन्यवाद!",
                "prompt_en": "Booking cancelled. Thank you!",
                "next_step": "end",
            }
        
        if req.input.strip() != "1":
            return {
                "prompt_hi": "कृपया 1 (पुष्टि) या 9 (रद्द) दबाएं।",
                "prompt_en": "Please press 1 to confirm or 9 to cancel.",
                "next_step": "confirm_booking",
                "farmer_id": req.farmer_id,
                "crop_choice": req.crop_choice,
                "centre_id": req.centre_id,
            }
        
        # Auto-find the best slot
        date = "2026-09-12"
        recommended = recommend_slot(db, req.centre_id, date, farmer_id=req.farmer_id)
        
        if not recommended:
            return {
                "prompt_hi": "क्षमा करें, कोई स्लॉट उपलब्ध नहीं है। कृपया कल प्रयास करें।",
                "prompt_en": "Sorry, no slots available. Please try tomorrow.",
                "next_step": "end",
                "error": "no_slots",
            }
        
        # Book the slot
        try:
            result = book_slot(db, req.farmer_id, req.centre_id, recommended["id"])
        except ValueError as e:
            return {
                "prompt_hi": f"बुकिंग विफल: {str(e)}",
                "prompt_en": f"Booking failed: {str(e)}",
                "next_step": "end",
                "error": str(e),
            }
        
        # Send SMS confirmation
        farmer = db.query(Farmer).filter(Farmer.farmer_id == req.farmer_id).first()
        centre = db.query(Centre).filter(Centre.id == req.centre_id).first()
        if farmer and farmer.phone:
            send_booking_confirmation(
                farmer.phone, result["token"],
                centre.name if centre else "",
                result["slot_time"],
                language="hi",
            )
        
        return {
            "prompt_hi": f"बुकिंग पक्की! आपका टोकन {result['token']}। समय: {result['slot_time']}। SMS भेजा गया।",
            "prompt_en": f"Booking confirmed! Your token is {result['token']}. Time: {result['slot_time']}. SMS sent.",
            "next_step": "end",
            "booking": result,
            "sms_sent": True,
        }
    
    # Default / END
    return {
        "prompt_hi": "धन्यवाद! किसानसेतु से जुड़ने के लिए शुक्रिया।",
        "prompt_en": "Thank you for using KisanSetu!",
        "next_step": "end",
    }


@router.get("/crop-menu")
def get_crop_menu():
    """Return the IVR crop selection menu."""
    return {"menu": CROP_MENU}


@router.get("/centre-menu")
def get_centre_menu(db: Session = Depends(get_db)):
    """Return the IVR centre selection menu with names."""
    centres = db.query(Centre).all()
    menu = {}
    for i, centre in enumerate(centres, 1):
        menu[str(i)] = {
            "id": centre.id,
            "name": centre.name,
            "name_hi": centre.name_hi,
        }
    return {"menu": menu}
