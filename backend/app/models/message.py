"""Message model."""
from datetime import datetime
from typing import Optional
from bson import ObjectId


class Message:
    """Message model for MongoDB."""
    
    collection_name = "messages"
    
    def __init__(
        self,
        rental_id: ObjectId,
        sender_id: ObjectId,
        receiver_id: ObjectId,
        content: str,
        message_type: str = "text",
        read_at: Optional[datetime] = None,
        _id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None
    ):
        self._id = _id or ObjectId()
        self.rental_id = rental_id
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.content = content
        self.message_type = message_type  # text, image
        self.read_at = read_at
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convert message to dictionary."""
        return {
            "_id": self._id,
            "rental_id": self.rental_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "message_type": self.message_type,
            "read_at": self.read_at,
            "created_at": self.created_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Message":
        """Create message from dictionary."""
        return cls(
            _id=data.get("_id"),
            rental_id=data["rental_id"],
            sender_id=data["sender_id"],
            receiver_id=data["receiver_id"],
            content=data["content"],
            message_type=data.get("message_type", "text"),
            read_at=data.get("read_at"),
            created_at=data.get("created_at")
        )



