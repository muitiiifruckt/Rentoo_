"""Rental CRUD operations."""
from typing import Optional, List
from datetime import date, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.rental import Rental
from app.models.availability_calendar import AvailabilityCalendar


async def get_rental_by_id(db: AsyncIOMotorDatabase, rental_id: str) -> Optional[dict]:
    """Get rental by ID."""
    if not ObjectId.is_valid(rental_id):
        return None
    rental = await db[Rental.collection_name].find_one({"_id": ObjectId(rental_id)})
    return rental


async def create_rental(
    db: AsyncIOMotorDatabase,
    item_id: str,
    renter_id: str,
    owner_id: str,
    start_date: date,
    end_date: date,
    total_price: float
) -> dict:
    """Create a new rental request."""
    rental = Rental(
        item_id=ObjectId(item_id),
        renter_id=ObjectId(renter_id),
        owner_id=ObjectId(owner_id),
        start_date=start_date,
        end_date=end_date,
        total_price=total_price,
        status="pending"
    )
    rental_dict = rental.to_dict()
    result = await db[Rental.collection_name].insert_one(rental_dict)
    rental_dict["_id"] = result.inserted_id
    return rental_dict


async def update_rental_status(
    db: AsyncIOMotorDatabase,
    rental_id: str,
    owner_id: str,
    status: str
) -> Optional[dict]:
    """Update rental status (confirm/cancel/complete)."""
    if not ObjectId.is_valid(rental_id) or not ObjectId.is_valid(owner_id):
        return None
    
    # Check ownership
    rental = await get_rental_by_id(db, rental_id)
    if not rental or rental["owner_id"] != ObjectId(owner_id):
        return None
    
    update_data = {"status": status, "updated_at": Rental().created_at}
    
    # If confirmed, update availability calendar
    if status == "confirmed":
        await _update_availability_for_rental(db, rental_id, rental["item_id"], rental["start_date"], rental["end_date"], available=False)
    
    result = await db[Rental.collection_name].update_one(
        {"_id": ObjectId(rental_id)},
        {"$set": update_data}
    )
    
    if result.modified_count:
        return await get_rental_by_id(db, rental_id)
    return None


async def get_user_rentals(db: AsyncIOMotorDatabase, user_id: str, role: str = "all") -> List[dict]:
    """Get rentals for a user (as renter, owner, or all)."""
    if not ObjectId.is_valid(user_id):
        return []
    
    query = {}
    if role == "renter":
        query["renter_id"] = ObjectId(user_id)
    elif role == "owner":
        query["owner_id"] = ObjectId(user_id)
    else:
        query["$or"] = [
            {"renter_id": ObjectId(user_id)},
            {"owner_id": ObjectId(user_id)}
        ]
    
    cursor = db[Rental.collection_name].find(query).sort("created_at", -1)
    rentals = await cursor.to_list(length=1000)
    return rentals


async def check_item_availability(
    db: AsyncIOMotorDatabase,
    item_id: str,
    start_date: date,
    end_date: date
) -> bool:
    """Check if item is available for given dates."""
    if not ObjectId.is_valid(item_id):
        return False
    
    # Check for overlapping rentals
    query = {
        "item_id": ObjectId(item_id),
        "status": {"$in": ["confirmed", "in_progress"]},
        "$or": [
            {
                "start_date": {"$lte": end_date.isoformat()},
                "end_date": {"$gte": start_date.isoformat()}
            }
        ]
    }
    
    existing = await db[Rental.collection_name].find_one(query)
    return existing is None


async def _update_availability_for_rental(
    db: AsyncIOMotorDatabase,
    rental_id: str,
    item_id: str,
    start_date: date,
    end_date: date,
    available: bool
):
    """Update availability calendar for rental dates."""
    current_date = start_date
    while current_date <= end_date:
        await db[AvailabilityCalendar.collection_name].update_one(
            {"item_id": ObjectId(item_id), "date": current_date.isoformat()},
            {
                "$set": {
                    "available": available,
                    "rental_id": ObjectId(rental_id) if not available else None
                }
            },
            upsert=True
        )
        # Move to next day
        current_date = current_date + timedelta(days=1)

