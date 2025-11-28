"""User CRUD operations."""
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import User
from app.utils.auth import get_password_hash, verify_password


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    """Get user by email."""
    user = await db[User.collection_name].find_one({"email": email})
    return user


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[dict]:
    """Get user by ID."""
    if not ObjectId.is_valid(user_id):
        return None
    user = await db[User.collection_name].find_one({"_id": ObjectId(user_id)})
    return user


async def create_user(db: AsyncIOMotorDatabase, email: str, password: str, name: str) -> dict:
    """Create a new user."""
    password_hash = get_password_hash(password)
    user = User(email=email, password_hash=password_hash, name=name)
    user_dict = user.to_dict()
    result = await db[User.collection_name].insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    return user_dict


async def update_user(db: AsyncIOMotorDatabase, user_id: str, update_data: dict) -> Optional[dict]:
    """Update user."""
    if not ObjectId.is_valid(user_id):
        return None
    
    from datetime import datetime
    update_data["updated_at"] = datetime.utcnow()
    result = await db[User.collection_name].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.modified_count:
        return await get_user_by_id(db, user_id)
    return None


async def verify_user_password(user: dict, password: str) -> bool:
    """Verify user password."""
    from app.utils.auth import verify_password
    return verify_password(password, user["password_hash"])

