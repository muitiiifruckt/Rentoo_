"""Item routes."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, ItemSearch
from app.dependencies import get_current_user, get_optional_current_user
from app.database import get_database
from app.crud.items import (
    create_item, get_item_by_id, update_item, delete_item,
    search_items, get_user_items
)
from app.utils.file_upload import save_uploaded_file
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/api/items", tags=["items"])


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_new_item(
    item_data: ItemCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new item."""
    item_dict = item_data.dict()
    item = await create_item(db, str(current_user["_id"]), item_dict)
    # Convert all ObjectIds to strings
    item["_id"] = str(item["_id"])
    item["id"] = str(item["_id"])  # Also add id field for Pydantic
    if "owner_id" in item:
        item["owner_id"] = str(item["owner_id"])
    # Ensure created_at and updated_at are properly serialized
    if "created_at" in item and hasattr(item["created_at"], "isoformat"):
        item["created_at"] = item["created_at"].isoformat()
    if "updated_at" in item and hasattr(item["updated_at"], "isoformat"):
        item["updated_at"] = item["updated_at"].isoformat()
    return item


@router.get("", response_model=List[ItemResponse])
async def list_items(
    search: ItemSearch = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Search and list items."""
    items = await search_items(db, search)
    for item in items:
        item["_id"] = str(item["_id"])
        item["id"] = str(item["_id"])  # Also add id field for Pydantic
        item["owner_id"] = str(item["owner_id"])
        # Ensure created_at and updated_at are properly serialized
        if "created_at" in item and hasattr(item["created_at"], "isoformat"):
            item["created_at"] = item["created_at"].isoformat()
        if "updated_at" in item and hasattr(item["updated_at"], "isoformat"):
            item["updated_at"] = item["updated_at"].isoformat()
    return items


@router.get("/my", response_model=List[ItemResponse])
async def get_my_items(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user's items."""
    items = await get_user_items(db, str(current_user["_id"]))
    for item in items:
        item["_id"] = str(item["_id"])
        item["id"] = str(item["_id"])  # Also add id field for Pydantic
        item["owner_id"] = str(item["owner_id"])
        # Ensure created_at and updated_at are properly serialized
        if "created_at" in item and hasattr(item["created_at"], "isoformat"):
            item["created_at"] = item["created_at"].isoformat()
        if "updated_at" in item and hasattr(item["updated_at"], "isoformat"):
            item["updated_at"] = item["updated_at"].isoformat()
    return items


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get item by ID."""
    item = await get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    item["_id"] = str(item["_id"])
    item["id"] = str(item["_id"])  # Also add id field for Pydantic
    item["owner_id"] = str(item["owner_id"])
    # Ensure created_at and updated_at are properly serialized
    if "created_at" in item and hasattr(item["created_at"], "isoformat"):
        item["created_at"] = item["created_at"].isoformat()
    if "updated_at" in item and hasattr(item["updated_at"], "isoformat"):
        item["updated_at"] = item["updated_at"].isoformat()
    return item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item_details(
    item_id: str,
    item_data: ItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update item."""
    update_dict = item_data.dict(exclude_unset=True)
    if not update_dict:
        item = await get_item_by_id(db, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
        item["_id"] = str(item["_id"])
        item["owner_id"] = str(item["owner_id"])
        return item
    
    updated_item = await update_item(db, item_id, str(current_user["_id"]), update_dict)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized"
        )
    
    updated_item["_id"] = str(updated_item["_id"])
    updated_item["owner_id"] = str(updated_item["owner_id"])
    # Ensure created_at and updated_at are properly serialized
    if "created_at" in updated_item and hasattr(updated_item["created_at"], "isoformat"):
        updated_item["created_at"] = updated_item["created_at"].isoformat()
    if "updated_at" in updated_item and hasattr(updated_item["updated_at"], "isoformat"):
        updated_item["updated_at"] = updated_item["updated_at"].isoformat()
    return updated_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_endpoint(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete item."""
    deleted = await delete_item(db, item_id, str(current_user["_id"]))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized"
        )


@router.post("/{item_id}/images", response_model=ItemResponse)
async def upload_item_image(
    item_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload image for item."""
    # Check ownership
    item = await get_item_by_id(db, item_id)
    if not item or str(item["owner_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or not authorized"
        )
    
    # Save file
    file_url = await save_uploaded_file(file, "items")
    if not file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type or size"
        )
    
    # Update item
    images = item.get("images", [])
    images.append(file_url)
    updated_item = await update_item(db, item_id, str(current_user["_id"]), {"images": images})
    
    updated_item["_id"] = str(updated_item["_id"])
    updated_item["owner_id"] = str(updated_item["owner_id"])
    # Ensure created_at and updated_at are properly serialized
    if "created_at" in updated_item and hasattr(updated_item["created_at"], "isoformat"):
        updated_item["created_at"] = updated_item["created_at"].isoformat()
    if "updated_at" in updated_item and hasattr(updated_item["updated_at"], "isoformat"):
        updated_item["updated_at"] = updated_item["updated_at"].isoformat()
    return updated_item

