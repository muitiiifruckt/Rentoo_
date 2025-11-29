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
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Getting all categories")
    categories = await get_all_categories(db)
    logger.info(f"Found {len(categories)} categories")
    for category in categories:
        category["_id"] = str(category["_id"])
        category["id"] = str(category["_id"])  # Also add id field for Pydantic
        # Ensure dates are properly serialized
        if "created_at" in category and hasattr(category["created_at"], "isoformat"):
            category["created_at"] = category["created_at"].isoformat()
        if "updated_at" in category and hasattr(category["updated_at"], "isoformat"):
            category["updated_at"] = category["updated_at"].isoformat()
    return categories

