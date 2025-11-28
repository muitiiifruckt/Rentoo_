"""Notification model."""
from datetime import datetime
from typing import Optional
from bson import ObjectId


class Notification:
    """Notification model for MongoDB."""
    
    collection_name = "notifications"
    
    def __init__(
        self,
        user_id: ObjectId,
        notification_type: str,
        title: str,
        content: str,
        read_at: Optional[datetime] = None,
        _id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None
    ):
        self._id = _id or ObjectId()
        self.user_id = user_id
        self.notification_type = notification_type  # new_rental_request, new_message
        self.title = title
        self.content = content
        self.read_at = read_at
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert notification to dictionary."""
        return {
            "_id": self._id,
            "user_id": self.user_id,
            "notification_type": self.notification_type,
            "title": self.title,
            "content": self.content,
            "read_at": self.read_at,
            "created_at": self.created_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Notification":
        """Create notification from dictionary."""
        return cls(
            _id=data.get("_id"),
            user_id=data["user_id"],
            notification_type=data["notification_type"],
            title=data["title"],
            content=data["content"],
            read_at=data.get("read_at"),
            created_at=data.get("created_at")
        )

