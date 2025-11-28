"""Notification CRUD operations."""
from typing import List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.notification import Notification
from datetime import datetime


async def create_notification(
    db: AsyncIOMotorDatabase,
    user_id: str,
    notification_type: str,
    title: str,
    content: str
) -> dict:
    """Create a new notification."""
    notification = Notification(
        user_id=ObjectId(user_id),
        notification_type=notification_type,
        title=title,
        content=content
    )
    notification_dict = notification.to_dict()
    result = await db[Notification.collection_name].insert_one(notification_dict)
    notification_dict["_id"] = result.inserted_id
    return notification_dict


async def get_user_notifications(
    db: AsyncIOMotorDatabase,
    user_id: str,
    unread_only: bool = False
) -> List[dict]:
    """Get notifications for a user."""
    if not ObjectId.is_valid(user_id):
        return []
    
    query = {"user_id": ObjectId(user_id)}
    if unread_only:
        query["read_at"] = None
    
    cursor = db[Notification.collection_name].find(query).sort("created_at", -1)
    notifications = await cursor.to_list(length=1000)
    return notifications


async def mark_notification_as_read(db: AsyncIOMotorDatabase, notification_id: str, user_id: str) -> bool:
    """Mark notification as read."""
    if not ObjectId.is_valid(notification_id) or not ObjectId.is_valid(user_id):
        return False
    
    result = await db[Notification.collection_name].update_one(
        {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)},
        {"$set": {"read_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

