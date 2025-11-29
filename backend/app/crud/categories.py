"""Category CRUD operations."""
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.category import Category


async def get_all_categories(db) -> List[dict]:
    """Get all categories."""
    cursor = db[Category.collection_name].find({})
    categories = await cursor.to_list(length=1000)
    return categories


async def get_category_by_slug(db, slug: str):
    """Get category by slug."""
    category = await db[Category.collection_name].find_one({"slug": slug})
    return category


async def create_category(db, name: str, slug: str, description: str = None) -> dict:
    """Create a new category."""
    category = Category(name=name, slug=slug, description=description)
    category_dict = category.to_dict()
    result = await db[Category.collection_name].insert_one(category_dict)
    category_dict["_id"] = result.inserted_id
    return category_dict



