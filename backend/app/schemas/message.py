"""Message Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class MessageBase(BaseModel):
    """Base message schema."""
    content: str = Field(..., min_length=1)
    message_type: str = "text"  # text, image


class MessageCreate(MessageBase):
    """Schema for message creation."""
    rental_id: str
    receiver_id: str


class MessageResponse(MessageBase):
    """Schema for message response."""
    id: str = Field(..., alias="_id")
    rental_id: str
    sender_id: str
    receiver_id: str
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}



