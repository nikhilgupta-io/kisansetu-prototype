from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Centre(Base):
    __tablename__ = 'centres'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    name_hi = Column(String)
    centre_type = Column(String, default='Main Hub')
    distance_km = Column(Float, default=0.0)
    open_quota_mt = Column(Integer, default=500)
    location_x = Column(Float)
    location_y = Column(Float)
    capacity_per_hour = Column(Integer, default=60)
    status = Column(String, default='Normal')
    created_at = Column(DateTime, default=utcnow)

    slots = relationship("Slot", back_populates="centre")
    bookings = relationship("Booking", back_populates="centre")
    queue_entries = relationship("QueueEntry", back_populates="centre")

class Farmer(Base):
    __tablename__ = 'farmers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    name_hi = Column(String)
    phone = Column(String)
    crop = Column(String)
    crop_hi = Column(String)
    quantity_quintals = Column(Float)
    perishability_score = Column(Integer, default=1)  # 1=Low, 2=Medium, 3=High
    created_at = Column(DateTime, default=utcnow)

    bookings = relationship("Booking", back_populates="farmer")

class Slot(Base):
    __tablename__ = 'slots'

    id = Column(Integer, primary_key=True, autoincrement=True)
    centre_id = Column(Integer, ForeignKey('centres.id'))
    date = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    display_time = Column(String)
    max_capacity = Column(Integer, default=15)
    booked_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    centre = relationship("Centre", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey('farmers.id'))
    slot_id = Column(Integer, ForeignKey('slots.id'))
    centre_id = Column(Integer, ForeignKey('centres.id'))
    token = Column(String)
    status = Column(String, default='confirmed')
    booked_at = Column(DateTime, default=utcnow)

    farmer = relationship("Farmer", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")
    centre = relationship("Centre", back_populates="bookings")
    queue_entry = relationship("QueueEntry", back_populates="booking", uselist=False)
    procurement = relationship("Procurement", back_populates="booking", uselist=False)

class QueueEntry(Base):
    __tablename__ = 'queue_entries'

    id = Column(Integer, primary_key=True, autoincrement=True)
    centre_id = Column(Integer, ForeignKey('centres.id'))
    booking_id = Column(Integer, ForeignKey('bookings.id'))
    position = Column(Integer)
    status = Column(String, default='waiting')
    called_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    centre = relationship("Centre", back_populates="queue_entries")
    booking = relationship("Booking", back_populates="queue_entry")

class Procurement(Base):
    __tablename__ = 'procurements'

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey('bookings.id'), unique=True)
    actual_weight = Column(Float)
    quality_grade = Column(String)
    rate_per_quintal = Column(Float)
    total_value = Column(Float)
    status = Column(String, default='pending')
    completed_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="procurement")
    payment = relationship("Payment", back_populates="procurement", uselist=False)

class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    procurement_id = Column(Integer, ForeignKey('procurements.id'), unique=True)
    amount = Column(Float)
    status = Column(String, default='pending')
    initiated_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    procurement = relationship("Procurement", back_populates="payment")
