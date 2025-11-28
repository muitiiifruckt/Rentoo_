"""Availability calendar model."""
from datetime import date, datetime
from typing import Optional
from bson import ObjectId


class AvailabilityCalendar:
    """Availability calendar model for MongoDB."""
    
    collection_name = "availability_calendar"
    
    def __init__(
        self,
        item_id: ObjectId,
        date: date,
        available: bool = True,
        rental_id: Optional[ObjectId] = None,
        _id: Optional[ObjectId] = None
    ):
        self._id = _id or ObjectId()
        self.item_id = item_id
        self.date = date
        self.available = available
        self.rental_id = rental_id
    
    def to_dict(self) -> dict:
        """Convert availability to dictionary."""
        return {
            "_id": self._id,
            "item_id": self.item_id,
            "date": self.date.isoformat() if isinstance(self.date, date) else self.date,
            "available": self.available,
            "rental_id": self.rental_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "AvailabilityCalendar":
        """Create availability from dictionary."""
        date_value = data["date"]
        if isinstance(date_value, str):
            date_value = datetime.fromisoformat(date_value).date()
        
        return cls(
            _id=data.get("_id"),
            item_id=data["item_id"],
            date=date_value,
            available=data.get("available", True),
            rental_id=data.get("rental_id")
        )

