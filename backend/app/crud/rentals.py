"""Rental CRUD operations."""
import logging
from typing import Optional, List
from datetime import date, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.rental import Rental
from app.models.availability_calendar import AvailabilityCalendar

logger = logging.getLogger(__name__)


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
    
    from datetime import datetime
    update_data = {"status": status, "updated_at": datetime.utcnow()}
    
    # If confirmed, update availability calendar
    if status == "confirmed":
        from datetime import date as date_type
        # Convert date strings to date objects if needed
        start_date = rental["start_date"]
        end_date = rental["end_date"]
        if isinstance(start_date, str):
            from datetime import datetime
            start_date = datetime.fromisoformat(start_date).date()
        if isinstance(end_date, str):
            from datetime import datetime
            end_date = datetime.fromisoformat(end_date).date()
        await _update_availability_for_rental(db, rental_id, str(rental["item_id"]), start_date, end_date, available=False)
    
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
    logger.info(f"Checking availability: item_id={item_id}, start_date={start_date}, end_date={end_date}")
    if not ObjectId.is_valid(item_id):
        logger.warning(f"Invalid item_id: {item_id}")
        return False
    
    # Check for overlapping rentals
    # Dates in MongoDB can be stored as ISO strings or date objects
    # We need to check both formats
    from datetime import datetime
    
    # Convert request dates to datetime for comparison
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    # Find all confirmed/in_progress rentals for this item
    query = {
        "item_id": ObjectId(item_id),
        "status": {"$in": ["confirmed", "in_progress"]}
    }
    
    rentals = await db[Rental.collection_name].find(query).to_list(length=1000)
    
    # Check for overlaps
    logger.info(f"Found {len(rentals)} existing rentals to check")
    for rental in rentals:
        rental_start = rental.get("start_date")
        rental_end = rental.get("end_date")
        logger.debug(f"Checking rental: _id={rental.get('_id')}, start_date={rental_start} (type: {type(rental_start)}), end_date={rental_end} (type: {type(rental_end)})")
        
        # Convert to date if needed
        if isinstance(rental_start, str):
            rental_start = datetime.fromisoformat(rental_start.replace('Z', '+00:00')).date()
        elif isinstance(rental_start, datetime):
            rental_start = rental_start.date()
        elif not isinstance(rental_start, date):
            logger.warning(f"Skipping rental {rental.get('_id')}: invalid start_date type {type(rental_start)}")
            continue
            
        if isinstance(rental_end, str):
            rental_end = datetime.fromisoformat(rental_end.replace('Z', '+00:00')).date()
        elif isinstance(rental_end, datetime):
            rental_end = rental_end.date()
        elif not isinstance(rental_end, date):
            logger.warning(f"Skipping rental {rental.get('_id')}: invalid end_date type {type(rental_end)}")
            continue
        
        # Check for overlap: rental_start <= request_end AND rental_end >= request_start
        if rental_start <= end_date and rental_end >= start_date:
            logger.info(f"Overlap found: rental {rental.get('_id')} overlaps with requested dates")
            return False
    
    logger.info("No overlaps found, item is available")
    return True


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

