"""
KisanSetu — Database Seed Script.

Run this once to populate the database with demo data that matches
the existing frontend mock data. Safe to re-run (checks for existing data).

Usage:
    python seed.py
"""

from datetime import datetime, timezone

from database import engine, Base, SessionLocal
from models import Centre, Farmer, Slot, Booking, QueueEntry, Procurement, Payment


def seed():
    """Populate the database with demo data."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Check if already seeded
    if db.query(Centre).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database …")

    # ------------------------------------------------------------------ #
    # Centres (matches CENTRES in App.jsx)                                #
    # ------------------------------------------------------------------ #
    centres = [
        Centre(
            name="Sehore Procurement Centre",
            name_hi="सीहोर खरीद केंद्र",
            location_x=27,
            location_y=56,
            capacity_per_hour=60,
            status="Busy",
        ),
        Centre(
            name="Vidisha Procurement Centre",
            name_hi="विदिशा खरीद केंद्र",
            location_x=70,
            location_y=34,
            capacity_per_hour=60,
            status="Critical",
        ),
        Centre(
            name="Bhopal Procurement Centre",
            name_hi="भोपाल खरीद केंद्र",
            location_x=50,
            location_y=50,
            capacity_per_hour=60,
            status="Normal",
        ),
        Centre(
            name="Raisen Procurement Centre",
            name_hi="रायसेन खरीद केंद्र",
            location_x=66,
            location_y=66,
            capacity_per_hour=60,
            status="Normal",
        ),
        Centre(
            name="Ujjain Procurement Centre",
            name_hi="उज्जैन खरीद केंद्र",
            location_x=16,
            location_y=78,
            capacity_per_hour=60,
            status="Normal",
        ),
    ]
    db.add_all(centres)
    db.flush()
    print(f"  ✓ {len(centres)} centres created")

    # ------------------------------------------------------------------ #
    # Farmers                                                             #
    # ------------------------------------------------------------------ #
    farmers = [
        Farmer(
            farmer_id="FR-98213",
            name="Ram Lal",
            name_hi="रामलाल",
            phone="+919876543210",
            crop="Wheat",
            crop_hi="गेहूं",
            quantity_quintals=42.5,
            perishability_score=1,
        ),
        Farmer(
            farmer_id="FR-98214",
            name="Suresh Kumar",
            name_hi="सुरेश कुमार",
            phone="+919876543211",
            crop="Wheat",
            crop_hi="गेहूं",
            quantity_quintals=35.0,
            perishability_score=1,
        ),
        Farmer(
            farmer_id="FR-98215",
            name="Mohan Singh",
            name_hi="मोहन सिंह",
            phone="+919876543212",
            crop="Paddy",
            crop_hi="धान",
            quantity_quintals=28.0,
            perishability_score=2,
        ),
        Farmer(
            farmer_id="FR-98216",
            name="Ravi Patel",
            name_hi="रवि पटेल",
            phone="+919876543213",
            crop="Wheat",
            crop_hi="गेहूं",
            quantity_quintals=50.0,
            perishability_score=1,
        ),
        Farmer(
            farmer_id="FR-98217",
            name="Dinesh Yadav",
            name_hi="दिनेश यादव",
            phone="+919876543214",
            crop="Soybean",
            crop_hi="सोयाबीन",
            quantity_quintals=20.0,
            perishability_score=3,
        ),
    ]
    db.add_all(farmers)
    db.flush()
    print(f"  ✓ {len(farmers)} farmers created")

    # ------------------------------------------------------------------ #
    # Slots for Sehore centre (centre_id=1) on 2026-09-12                #
    # Matches SLOTS in App.jsx                                            #
    # ------------------------------------------------------------------ #
    sehore = centres[0]
    slot_date = "2026-09-12"

    slot_defs = [
        ("08:00", "09:00", "08:00 AM – 09:00 AM", 15, 3),    # 12 left
        ("09:00", "10:00", "09:00 AM – 10:00 AM", 15, 7),    # 8 left
        ("10:30", "11:30", "10:30 AM – 11:30 AM", 15, 9),    # 6 left
        ("11:00", "12:00", "11:00 AM – 12:00 PM", 15, 12),   # 3 left
        ("12:00", "13:00", "12:00 PM – 01:00 PM", 15, 15),   # 0 left (full)
    ]

    slots = []
    for start, end, display, capacity, booked in slot_defs:
        slot = Slot(
            centre_id=sehore.id,
            date=slot_date,
            start_time=start,
            end_time=end,
            display_time=display,
            max_capacity=capacity,
            booked_count=booked,
        )
        slots.append(slot)
    db.add_all(slots)
    db.flush()
    print(f"  ✓ {len(slots)} slots created for Sehore on {slot_date}")

    # Also create slots for Vidisha (centre_id=2) — these will show demand > capacity
    vidisha = centres[1]
    vidisha_slot_defs = [
        ("08:00", "09:00", "08:00 AM – 09:00 AM", 15, 10),
        ("09:00", "10:00", "09:00 AM – 10:00 AM", 15, 14),
        ("10:00", "11:00", "10:00 AM – 11:00 AM", 15, 15),   # full — demand > capacity
        ("11:00", "12:00", "11:00 AM – 12:00 PM", 15, 15),   # full — demand > capacity
        ("12:00", "13:00", "12:00 PM – 01:00 PM", 15, 12),
        ("13:00", "14:00", "01:00 PM – 02:00 PM", 15, 8),
    ]
    vidisha_slots = []
    for start, end, display, capacity, booked in vidisha_slot_defs:
        slot = Slot(
            centre_id=vidisha.id,
            date=slot_date,
            start_time=start,
            end_time=end,
            display_time=display,
            max_capacity=capacity,
            booked_count=booked,
        )
        vidisha_slots.append(slot)
    db.add_all(vidisha_slots)
    db.flush()
    print(f"  ✓ {len(vidisha_slots)} slots created for Vidisha on {slot_date}")

    # Slots for Bhopal — underloaded (good redistribution target)
    bhopal = centres[2]
    bhopal_slot_defs = [
        ("08:00", "09:00", "08:00 AM – 09:00 AM", 15, 2),
        ("09:00", "10:00", "09:00 AM – 10:00 AM", 15, 4),
        ("10:00", "11:00", "10:00 AM – 11:00 AM", 15, 3),
        ("11:00", "12:00", "11:00 AM – 12:00 PM", 15, 2),
        ("12:00", "13:00", "12:00 PM – 01:00 PM", 15, 1),
        ("13:00", "14:00", "01:00 PM – 02:00 PM", 15, 0),
    ]
    bhopal_slots = []
    for start, end, display, capacity, booked in bhopal_slot_defs:
        slot = Slot(
            centre_id=bhopal.id,
            date=slot_date,
            start_time=start,
            end_time=end,
            display_time=display,
            max_capacity=capacity,
            booked_count=booked,
        )
        bhopal_slots.append(slot)
    db.add_all(bhopal_slots)
    db.flush()
    print(f"  ✓ {len(bhopal_slots)} slots created for Bhopal on {slot_date}")

    # ------------------------------------------------------------------ #
    # Bookings — create bookings for the demo farmers                     #
    # Matches the queue (A-124, A-125, A-126, A-127) in App.jsx           #
    # ------------------------------------------------------------------ #
    now = datetime.now(timezone.utc)
    sehore_slot_3 = slots[2]  # 10:30 AM – 11:30 AM slot

    booking_defs = [
        (farmers[1], "A-124", sehore_slot_3),  # Suresh — ahead in queue
        (farmers[2], "A-125", sehore_slot_3),  # Mohan — ahead in queue
        (farmers[3], "A-126", sehore_slot_3),  # Ravi — ahead in queue
        (farmers[0], "A-127", sehore_slot_3),  # Ram Lal — our main farmer
        (farmers[4], "A-128", sehore_slot_3),  # Dinesh — behind in queue
    ]

    bookings = []
    for farmer, token, slot in booking_defs:
        booking = Booking(
            farmer_id=farmer.id,
            slot_id=slot.id,
            centre_id=sehore.id,
            token=token,
            status="confirmed",
            booked_at=now,
        )
        bookings.append(booking)
    db.add_all(bookings)
    db.flush()
    print(f"  ✓ {len(bookings)} bookings created")

    # ------------------------------------------------------------------ #
    # Queue entries — set up the live queue                                #
    # Current token being processed: A-123 (we'll create a virtual one)   #
    # A-124, A-125, A-126 are ahead of A-127                              #
    # ------------------------------------------------------------------ #

    # Create a "currently processing" farmer for A-123
    farmer_current = Farmer(
        farmer_id="FR-98218",
        name="Prakash Sharma",
        name_hi="प्रकाश शर्मा",
        phone="+919876543215",
        crop="Wheat",
        crop_hi="गेहूं",
        quantity_quintals=30.0,
        perishability_score=1,
    )
    db.add(farmer_current)
    db.flush()

    booking_current = Booking(
        farmer_id=farmer_current.id,
        slot_id=sehore_slot_3.id,
        centre_id=sehore.id,
        token="A-123",
        status="confirmed",
        booked_at=now,
    )
    db.add(booking_current)
    db.flush()

    # Queue entries
    queue_entries = [
        QueueEntry(
            centre_id=sehore.id,
            booking_id=booking_current.id,
            position=1,
            status="processing",
            called_at=now,
        ),
    ]

    for i, booking in enumerate(bookings):
        status = "waiting"
        queue_entries.append(
            QueueEntry(
                centre_id=sehore.id,
                booking_id=booking.id,
                position=i + 2,  # position 2, 3, 4, 5, 6
                status=status,
            )
        )
    db.add_all(queue_entries)
    db.flush()
    print(f"  ✓ {len(queue_entries)} queue entries created")

    # ------------------------------------------------------------------ #
    # Seed some completed bookings for stats                              #
    # Admin shows ~8923 completed                                         #
    # For a prototype, we'll mark a reasonable count                       #
    # ------------------------------------------------------------------ #
    # We'll set a counter in the admin stats calculation instead
    # of creating 8000+ fake records. The admin endpoint will add
    # a base count.

    db.commit()
    db.close()
    print("\n✅ Database seeded successfully!")
    print("   Run the server with: uvicorn main:app --reload")


if __name__ == "__main__":
    seed()

