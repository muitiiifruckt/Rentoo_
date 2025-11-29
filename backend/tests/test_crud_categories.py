"""Tests for category CRUD operations."""
import pytest
from app.crud.categories import get_all_categories, get_category_by_slug, create_category


@pytest.mark.asyncio
async def test_create_category(test_db, sample_category_data):
    """Test category creation."""
    category = await create_category(
        test_db,
        sample_category_data["name"],
        sample_category_data["slug"],
        sample_category_data["description"]
    )
    
    assert category is not None
    assert category["name"] == sample_category_data["name"]
    assert category["slug"] == sample_category_data["slug"]
    assert category["description"] == sample_category_data["description"]


@pytest.mark.asyncio
async def test_get_all_categories(test_db, sample_category_data):
    """Test getting all categories."""
    # Create multiple categories
    await create_category(test_db, "Electronics", "electronics", "Electronic devices")
    await create_category(test_db, "Sports", "sports", "Sports equipment")
    
    categories = await get_all_categories(test_db)
    
    assert len(categories) >= 2
    slugs = [cat["slug"] for cat in categories]
    assert "electronics" in slugs
    assert "sports" in slugs


@pytest.mark.asyncio
async def test_get_category_by_slug(test_db, sample_category_data):
    """Test getting category by slug."""
    created_category = await create_category(
        test_db,
        sample_category_data["name"],
        sample_category_data["slug"],
        sample_category_data["description"]
    )
    
    category = await get_category_by_slug(test_db, sample_category_data["slug"])
    
    assert category is not None
    assert category["slug"] == sample_category_data["slug"]
    assert category["_id"] == created_category["_id"]


@pytest.mark.asyncio
async def test_get_category_by_slug_not_found(test_db):
    """Test getting non-existent category."""
    category = await get_category_by_slug(test_db, "nonexistent")
    assert category is None



