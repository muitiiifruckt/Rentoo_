"""Category model."""
from datetime import datetime
from typing import Optional
from bson import ObjectId


class Category:
    """Category model for MongoDB."""
    
    collection_name = "categories"
    
    def __init__(
        self,
        name: str,
        slug: str,
        description: Optional[str] = None,
        _id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self._id = _id or ObjectId()
        self.name = name
        self.slug = slug
        self.description = description
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert category to dictionary."""
        return {
            "_id": self._id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Category":
        """Create category from dictionary."""
        return cls(
            _id=data.get("_id"),
            name=data["name"],
            slug=data["slug"],
            description=data.get("description"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )

