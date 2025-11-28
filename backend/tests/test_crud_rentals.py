"""Tests for rental CRUD operations."""
import pytest
from datetime import date, timedelta
from app.crud.rentals import (
    create_rental, get_rental_by_id, update_rental_status,
    get_user_rentals, check_item_availability
)


@pytest.mark.asyncio
async def test_create_rental(test_db, sample_item_data):
    """Test rental creation."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    start_date = date.today() + timedelta(days=1)
    end_date = date.today() + timedelta(days=3)
    total_price = 300.0
    
    rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        start_date,
        end_date,
        total_price
    )
    
    assert rental is not None
    assert rental["item_id"] == item["_id"]
    assert rental["renter_id"] == renter["_id"]
    assert rental["owner_id"] == owner["_id"]
    assert rental["status"] == "pending"
    assert rental["total_price"] == total_price


@pytest.mark.asyncio
async def test_get_rental_by_id(test_db, sample_item_data):
    """Test getting rental by ID."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    created_rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        date.today() + timedelta(days=1),
        date.today() + timedelta(days=3),
        300.0
    )
    
    rental = await get_rental_by_id(test_db, str(created_rental["_id"]))
    
    assert rental is not None
    assert rental["_id"] == created_rental["_id"]


@pytest.mark.asyncio
async def test_update_rental_status(test_db, sample_item_data):
    """Test updating rental status."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    created_rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        date.today() + timedelta(days=1),
        date.today() + timedelta(days=3),
        300.0
    )
    
    updated_rental = await update_rental_status(
        test_db,
        str(created_rental["_id"]),
        str(owner["_id"]),
        "confirmed"
    )
    
    assert updated_rental is not None
    assert updated_rental["status"] == "confirmed"


@pytest.mark.asyncio
async def test_get_user_rentals(test_db, sample_item_data):
    """Test getting user rentals."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        date.today() + timedelta(days=1),
        date.today() + timedelta(days=3),
        300.0
    )
    
    # Get rentals as renter
    rentals_as_renter = await get_user_rentals(test_db, str(renter["_id"]), "renter")
    assert len(rentals_as_renter) == 1
    
    # Get rentals as owner
    rentals_as_owner = await get_user_rentals(test_db, str(owner["_id"]), "owner")
    assert len(rentals_as_owner) == 1
    
    # Get all rentals
    all_rentals = await get_user_rentals(test_db, str(renter["_id"]), "all")
    assert len(all_rentals) >= 1


@pytest.mark.asyncio
async def test_check_item_availability(test_db, sample_item_data):
    """Test checking item availability."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    start_date = date.today() + timedelta(days=1)
    end_date = date.today() + timedelta(days=3)
    
    # Check availability - should be available
    is_available = await check_item_availability(test_db, str(item["_id"]), start_date, end_date)
    assert is_available is True
    
    # Create rental and confirm it
    rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        start_date,
        end_date,
        300.0
    )
    
    await update_rental_status(test_db, str(rental["_id"]), str(owner["_id"]), "confirmed")
    
    # Check availability - should be unavailable
    is_available = await check_item_availability(test_db, str(item["_id"]), start_date, end_date)
    assert is_available is False

