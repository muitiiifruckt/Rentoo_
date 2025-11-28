"""Item CRUD operations."""
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.item import Item
from app.schemas.item import ItemSearch


async def get_item_by_id(db: AsyncIOMotorDatabase, item_id: str) -> Optional[dict]:
    """Get item by ID."""
    if not ObjectId.is_valid(item_id):
        return None
    item = await db[Item.collection_name].find_one({"_id": ObjectId(item_id)})
    return item


async def create_item(db: AsyncIOMotorDatabase, owner_id: str, item_data: dict) -> dict:
    """Create a new item."""
    if not ObjectId.is_valid(owner_id):
        raise ValueError("Invalid owner_id")
    
    item = Item(
        owner_id=ObjectId(owner_id),
        title=item_data["title"],
        description=item_data["description"],
        category=item_data["category"],
        price_per_day=item_data["price_per_day"],
        price_per_week=item_data.get("price_per_week"),
        price_per_month=item_data.get("price_per_month"),
        location=item_data.get("location"),
        parameters=item_data.get("parameters"),
        images=item_data.get("images", []),
        status=item_data.get("status", "draft")
    )
    item_dict = item.to_dict()
    result = await db[Item.collection_name].insert_one(item_dict)
    item_dict["_id"] = result.inserted_id
    return item_dict


async def update_item(db: AsyncIOMotorDatabase, item_id: str, owner_id: str, update_data: dict) -> Optional[dict]:
    """Update item."""
    if not ObjectId.is_valid(item_id) or not ObjectId.is_valid(owner_id):
        return None
    
    # Check ownership
    item = await get_item_by_id(db, item_id)
    if not item or item["owner_id"] != ObjectId(owner_id):
        return None
    
    from datetime import datetime
    update_data["updated_at"] = datetime.utcnow()
    result = await db[Item.collection_name].update_one(
        {"_id": ObjectId(item_id), "owner_id": ObjectId(owner_id)},
        {"$set": update_data}
    )
    
    if result.modified_count:
        return await get_item_by_id(db, item_id)
    return None


async def delete_item(db: AsyncIOMotorDatabase, item_id: str, owner_id: str) -> bool:
    """Delete item."""
    if not ObjectId.is_valid(item_id) or not ObjectId.is_valid(owner_id):
        return False
    
    result = await db[Item.collection_name].delete_one(
        {"_id": ObjectId(item_id), "owner_id": ObjectId(owner_id)}
    )
    return result.deleted_count > 0


async def search_items(db: AsyncIOMotorDatabase, search_params: ItemSearch) -> List[dict]:
    """Search items with filters."""
    query = {}
    
    # Text search
    if search_params.query:
        query["$or"] = [
            {"title": {"$regex": search_params.query, "$options": "i"}},
            {"description": {"$regex": search_params.query, "$options": "i"}}
        ]
    
    # Category filter
    if search_params.category:
        query["category"] = search_params.category
    
    # Price filter
    if search_params.min_price is not None or search_params.max_price is not None:
        price_query = {}
        if search_params.min_price is not None:
            price_query["$gte"] = search_params.min_price
        if search_params.max_price is not None:
            price_query["$lte"] = search_params.max_price
        query["price_per_day"] = price_query
    
    # Location filter (simple text match)
    if search_params.location:
        query["location.address"] = {"$regex": search_params.location, "$options": "i"}
    
    # Only active items
    query["status"] = "active"
    
    # Sort
    sort_field = search_params.sort_by or "created_at"
    sort_order = -1 if search_params.sort_order == "desc" else 1
    sort_query = [(sort_field, sort_order)]
    
    # Pagination
    skip = (search_params.page - 1) * search_params.limit
    
    cursor = db[Item.collection_name].find(query).sort(sort_query).skip(skip).limit(search_params.limit)
    items = await cursor.to_list(length=search_params.limit)
    
    return items


async def get_user_items(db: AsyncIOMotorDatabase, owner_id: str) -> List[dict]:
    """Get all items for a user."""
    if not ObjectId.is_valid(owner_id):
        return []
    
    cursor = db[Item.collection_name].find({"owner_id": ObjectId(owner_id)})
    items = await cursor.to_list(length=1000)
    return items

