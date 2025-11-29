"""Tests for item CRUD operations."""
import pytest
from bson import ObjectId
from app.crud.items import (
    create_item, get_item_by_id, update_item,
    delete_item, search_items, get_user_items
)
from app.schemas.item import ItemSearch


@pytest.mark.asyncio
async def test_create_item(test_db, sample_item_data):
    """Test item creation."""
    # Create a user first
    from app.crud.users import create_user
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    
    # Create item
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    assert item is not None
    assert item["title"] == sample_item_data["title"]
    assert item["description"] == sample_item_data["description"]
    assert item["owner_id"] == owner["_id"]
    assert item.get("status") in ["draft", "active"]  # Can be draft or active
    assert "_id" in item


@pytest.mark.asyncio
async def test_get_item_by_id(test_db, sample_item_data):
    """Test getting item by ID."""
    from app.crud.users import create_user
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    
    created_item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    item = await get_item_by_id(test_db, str(created_item["_id"]))
    
    assert item is not None
    assert item["_id"] == created_item["_id"]
    assert item["title"] == sample_item_data["title"]


@pytest.mark.asyncio
async def test_update_item(test_db, sample_item_data):
    """Test updating item."""
    from app.crud.users import create_user
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    
    created_item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    update_data = {"title": "Updated Title", "status": "active"}
    updated_item = await update_item(test_db, str(created_item["_id"]), str(owner["_id"]), update_data)
    
    assert updated_item is not None
    assert updated_item["title"] == "Updated Title"
    assert updated_item["status"] == "active"


@pytest.mark.asyncio
async def test_update_item_wrong_owner(test_db, sample_item_data):
    """Test updating item with wrong owner."""
    from app.crud.users import create_user
    owner1 = await create_user(test_db, "owner1@example.com", "password", "Owner1")
    owner2 = await create_user(test_db, "owner2@example.com", "password", "Owner2")
    
    created_item = await create_item(test_db, str(owner1["_id"]), sample_item_data)
    
    update_data = {"title": "Updated Title"}
    updated_item = await update_item(test_db, str(created_item["_id"]), str(owner2["_id"]), update_data)
    
    assert updated_item is None


@pytest.mark.asyncio
async def test_delete_item(test_db, sample_item_data):
    """Test deleting item."""
    from app.crud.users import create_user
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    
    created_item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    deleted = await delete_item(test_db, str(created_item["_id"]), str(owner["_id"]))
    assert deleted is True
    
    # Verify item is deleted
    item = await get_item_by_id(test_db, str(created_item["_id"]))
    assert item is None


@pytest.mark.asyncio
async def test_search_items(test_db, sample_item_data):
    """Test searching items."""
    from app.crud.users import create_user
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    
    # Create multiple items
    item_data1 = sample_item_data.copy()
    item_data1["title"] = "Camera"
    item_data1["status"] = "active"
    await create_item(test_db, str(owner["_id"]), item_data1)
    
    item_data2 = sample_item_data.copy()
    item_data2["title"] = "Bike"
    item_data2["status"] = "active"
    await create_item(test_db, str(owner["_id"]), item_data2)
    
    # Search by query
    search = ItemSearch(query="Camera", page=1, limit=10)
    results = await search_items(test_db, search)
    
    assert len(results) >= 1
    assert any(item["title"] == "Camera" for item in results)


@pytest.mark.asyncio
async def test_get_user_items(test_db, sample_item_data):
    """Test getting user's items."""
    from app.crud.users import create_user
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    
    # Create items
    await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    item_data2 = sample_item_data.copy()
    item_data2["title"] = "Second Item"
    await create_item(test_db, str(owner["_id"]), item_data2)
    
    items = await get_user_items(test_db, str(owner["_id"]))
    
    assert len(items) == 2
    assert all(str(item["owner_id"]) == str(owner["_id"]) for item in items)

