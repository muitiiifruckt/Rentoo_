"""Tests for user CRUD operations."""
import pytest
from app.crud.users import (
    create_user, get_user_by_email, get_user_by_id,
    update_user, verify_user_password
)
from app.utils.auth import verify_password


@pytest.mark.asyncio
async def test_create_user(test_db, sample_user_data):
    """Test user creation."""
    user = await create_user(
        test_db,
        sample_user_data["email"],
        sample_user_data["password"],
        sample_user_data["name"]
    )
    
    assert user is not None
    assert user["email"] == sample_user_data["email"]
    assert user["name"] == sample_user_data["name"]
    assert "password_hash" in user
    assert user["password_hash"] != sample_user_data["password"]
    assert "_id" in user


@pytest.mark.asyncio
async def test_get_user_by_email(test_db, sample_user_data):
    """Test getting user by email."""
    # Create user first
    created_user = await create_user(
        test_db,
        sample_user_data["email"],
        sample_user_data["password"],
        sample_user_data["name"]
    )
    
    # Get user by email
    user = await get_user_by_email(test_db, sample_user_data["email"])
    
    assert user is not None
    assert user["email"] == sample_user_data["email"]
    assert user["_id"] == created_user["_id"]


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(test_db):
    """Test getting non-existent user."""
    user = await get_user_by_email(test_db, "nonexistent@example.com")
    assert user is None


@pytest.mark.asyncio
async def test_get_user_by_id(test_db, sample_user_data):
    """Test getting user by ID."""
    # Create user first
    created_user = await create_user(
        test_db,
        sample_user_data["email"],
        sample_user_data["password"],
        sample_user_data["name"]
    )
    
    # Get user by ID
    user = await get_user_by_id(test_db, str(created_user["_id"]))
    
    assert user is not None
    assert user["email"] == sample_user_data["email"]
    assert user["_id"] == created_user["_id"]


@pytest.mark.asyncio
async def test_get_user_by_id_invalid(test_db):
    """Test getting user with invalid ID."""
    user = await get_user_by_id(test_db, "invalid_id")
    assert user is None


@pytest.mark.asyncio
async def test_update_user(test_db, sample_user_data):
    """Test updating user."""
    # Create user first
    created_user = await create_user(
        test_db,
        sample_user_data["email"],
        sample_user_data["password"],
        sample_user_data["name"]
    )
    
    # Update user
    update_data = {"name": "Updated Name", "avatar_url": "https://example.com/avatar.jpg"}
    updated_user = await update_user(test_db, str(created_user["_id"]), update_data)
    
    assert updated_user is not None
    assert updated_user["name"] == "Updated Name"
    assert updated_user["avatar_url"] == "https://example.com/avatar.jpg"
    assert updated_user["email"] == sample_user_data["email"]  # Email should not change


@pytest.mark.asyncio
async def test_verify_user_password(test_db, sample_user_data):
    """Test password verification."""
    # Create user first
    created_user = await create_user(
        test_db,
        sample_user_data["email"],
        sample_user_data["password"],
        sample_user_data["name"]
    )
    
    # Verify correct password
    assert await verify_user_password(created_user, sample_user_data["password"]) is True
    
    # Verify incorrect password
    assert await verify_user_password(created_user, "wrongpassword") is False

