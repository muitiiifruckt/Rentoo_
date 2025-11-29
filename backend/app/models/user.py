"""User model."""
from datetime import datetime
from typing import Optional
from bson import ObjectId


class User:
    """User model for MongoDB."""
    
    collection_name = "users"
    
    def __init__(
        self,
        email: str,
        password_hash: str,
        name: str,
        avatar_url: Optional[str] = None,
        _id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self._id = _id or ObjectId()
        self.email = email
        self.password_hash = password_hash
        self.name = name
        self.avatar_url = avatar_url
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert user to dictionary."""
        return {
            "_id": self._id,
            "email": self.email,
            "password_hash": self.password_hash,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Create user from dictionary."""
        return cls(
            _id=data.get("_id"),
            email=data["email"],
            password_hash=data["password_hash"],
            name=data["name"],
            avatar_url=data.get("avatar_url"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )



