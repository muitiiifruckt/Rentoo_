"""Notification Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class NotificationBase(BaseModel):
    """Base notification schema."""
    notification_type: str
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)


class NotificationResponse(NotificationBase):
    """Schema for notification response."""
    id: str = Field(..., alias="_id")
    user_id: str
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}



