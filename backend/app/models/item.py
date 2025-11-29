"""Item model."""
from datetime import datetime
from typing import Optional
from bson import ObjectId


class Item:
    """Item model for MongoDB."""
    
    collection_name = "items"
    
    def __init__(
        self,
        owner_id: ObjectId,
        title: str,
        description: str,
        category: str,
        price_per_day: float,
        price_per_week: Optional[float] = None,
        price_per_month: Optional[float] = None,
        location: Optional[dict] = None,
        parameters: Optional[dict] = None,
        images: Optional[list[str]] = None,
        status: str = "draft",
        _id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self._id = _id or ObjectId()
        self.owner_id = owner_id
        self.title = title
        self.description = description
        self.category = category
        self.price_per_day = price_per_day
        self.price_per_week = price_per_week
        self.price_per_month = price_per_month
        self.location = location or {}
        self.parameters = parameters or {}
        self.images = images or []
        self.status = status  # draft, active, inactive, archived
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert item to dictionary."""
        return {
            "_id": self._id,
            "owner_id": self.owner_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "price_per_day": self.price_per_day,
            "price_per_week": self.price_per_week,
            "price_per_month": self.price_per_month,
            "location": self.location,
            "parameters": self.parameters,
            "images": self.images,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Item":
        """Create item from dictionary."""
        return cls(
            _id=data.get("_id"),
            owner_id=data["owner_id"],
            title=data["title"],
            description=data["description"],
            category=data["category"],
            price_per_day=data["price_per_day"],
            price_per_week=data.get("price_per_week"),
            price_per_month=data.get("price_per_month"),
            location=data.get("location"),
            parameters=data.get("parameters"),
            images=data.get("images", []),
            status=data.get("status", "draft"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )



