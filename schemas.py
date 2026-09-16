from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime

class CentreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    name_hi: Optional[str] = None
    centre_type: Optional[str] = "Main Hub"
    distance_km: Optional[float] = 0.0
    open_quota_mt: Optional[int] = 500
    location_x: Optional[float] = None
    location_y: Optional[float] = None
    capacity_per_hour: int
    status: str

class FarmerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farmer_id: str
    name: str
    name_hi: Optional[str] = None
    phone: Optional[str] = None
    crop: Optional[str] = None
    crop_hi: Optional[str] = None
    quantity_quintals: Optional[float] = None

class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    centre_id: int
    date: str
    start_time: str
    end_time: str
    display_time: str
    max_capacity: int
    booked_count: int

    @computed_field
    @property
    def slots_left(self) -> int:
        return max(0, self.max_capacity - self.booked_count)
        
    @computed_field
    @property
    def tag(self) -> str:
        left = self.slots_left
        if left == 0:
            return 'full'
        elif left <= 3:
            return 'limited'
        return 'open'

class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farmer_id: int
    slot_id: int
    centre_id: int
    token: Optional[str] = None
    status: str
    booked_at: datetime

class QueueEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    centre_id: int
    booking_id: int
    token: Optional[str] = None
    position: Optional[int] = None
    status: str

class ProcurementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    actual_weight: Optional[float] = None
    quality_grade: Optional[str] = None
    rate_per_quintal: Optional[float] = None
    total_value: Optional[float] = None
    status: str

class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    procurement_id: int
    amount: Optional[float] = None
    status: str

class BookSlotRequest(BaseModel):
    farmer_id: str
    centre_id: int
    slot_id: int

class CompleteProcurementRequest(BaseModel):
    actual_weight: float
    quality_grade: str
    rate_per_quintal: float

class FarmerDashboard(BaseModel):
    farmer: FarmerOut
    next_booking: Optional[BookingOut] = None
    slot: Optional[SlotOut] = None
    centre: Optional[CentreOut] = None
    token: Optional[str] = None
    estimated_wait_min: Optional[int] = None
    queue_position: Optional[int] = None

class MandiDashboard(BaseModel):
    centre: CentreOut
    total_farmers: int
    waiting: int
    processing: int
    completed: int
    current_token: Optional[str] = None

class MandiUpcomingEntry(BaseModel):
    token: str
    time: str
    crop: str
    farmer_name: str
    booking_id: int

class AdminOverview(BaseModel):
    total_farmers: int
    completed: int
    waiting: int
    delayed: int
    centres: List[CentreOut]

class DemandCapacityPoint(BaseModel):
    hour: str
    demand: int
    capacity: int

class AllocationImbalance(BaseModel):
    centre_name: str
    centre_id: int
    peak_hour: str
    excess_demand: int
    recommendation: str
    target_centre: str
    target_centre_id: int
    move_count: int
