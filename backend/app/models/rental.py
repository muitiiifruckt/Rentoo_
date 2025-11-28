"""Rental model."""
from datetime import datetime, date
from typing import Optional
from bson import ObjectId


class Rental:
    """Rental (booking) model for MongoDB."""
    
    collection_name = "rentals"
    
    def __init__(
        self,
        item_id: ObjectId,
        renter_id: ObjectId,
        owner_id: ObjectId,
        start_date: date,
        end_date: date,
        total_price: float,
        status: str = "pending",
        _id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self._id = _id or ObjectId()
        self.item_id = item_id
        self.renter_id = renter_id
        self.owner_id = owner_id
        self.start_date = start_date
        self.end_date = end_date
        self.total_price = total_price
        self.status = status  # pending, confirmed, in_progress, completed, cancelled
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert rental to dictionary."""
        return {
            "_id": self._id,
            "item_id": self.item_id,
            "renter_id": self.renter_id,
            "owner_id": self.owner_id,
            "start_date": self.start_date.isoformat() if isinstance(self.start_date, date) else self.start_date,
            "end_date": self.end_date.isoformat() if isinstance(self.end_date, date) else self.end_date,
            "total_price": self.total_price,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Rental":
        """Create rental from dictionary."""
        start_date = data["start_date"]
        end_date = data["end_date"]
        
        # Convert string to date if needed
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date).date()
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date).date()
        
        return cls(
            _id=data.get("_id"),
            item_id=data["item_id"],
            renter_id=data["renter_id"],
            owner_id=data["owner_id"],
            start_date=start_date,
            end_date=end_date,
            total_price=data["total_price"],
            status=data.get("status", "pending"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )

