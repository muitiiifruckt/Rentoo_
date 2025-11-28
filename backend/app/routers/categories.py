"""Category routes."""
from fastapi import APIRouter, Depends
from typing import List
from app.schemas.category import CategoryResponse
from app.database import get_database
from app.crud.categories import get_all_categories
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all categories."""
    categories = await get_all_categories(db)
    for category in categories:
        category["_id"] = str(category["_id"])
        category["id"] = str(category["_id"])  # Also add id field for Pydantic
    return categories

