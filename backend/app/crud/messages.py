"""Message CRUD operations."""
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.message import Message


async def create_message(
    db: AsyncIOMotorDatabase,
    rental_id: str,
    sender_id: str,
    receiver_id: str,
    content: str,
    message_type: str = "text"
) -> dict:
    """Create a new message."""
    message = Message(
        rental_id=ObjectId(rental_id),
        sender_id=ObjectId(sender_id),
        receiver_id=ObjectId(receiver_id),
        content=content,
        message_type=message_type
    )
    message_dict = message.to_dict()
    result = await db[Message.collection_name].insert_one(message_dict)
    message_dict["_id"] = result.inserted_id
    return message_dict


async def get_rental_messages(db: AsyncIOMotorDatabase, rental_id: str) -> List[dict]:
    """Get all messages for a rental."""
    if not ObjectId.is_valid(rental_id):
        return []
    
    cursor = db[Message.collection_name].find({"rental_id": ObjectId(rental_id)}).sort("created_at", 1)
    messages = await cursor.to_list(length=1000)
    return messages


async def mark_message_as_read(db: AsyncIOMotorDatabase, message_id: str, user_id: str) -> bool:
    """Mark message as read."""
    if not ObjectId.is_valid(message_id) or not ObjectId.is_valid(user_id):
        return False
    
    from datetime import datetime
    result = await db[Message.collection_name].update_one(
        {"_id": ObjectId(message_id), "receiver_id": ObjectId(user_id)},
        {"$set": {"read_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

