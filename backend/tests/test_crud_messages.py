"""Tests for message CRUD operations."""
import pytest
from datetime import date, timedelta
from app.crud.messages import create_message, get_rental_messages, mark_message_as_read


@pytest.mark.asyncio
async def test_create_message(test_db, sample_item_data):
    """Test message creation."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    from app.crud.rentals import create_rental
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        date.today() + timedelta(days=1),
        date.today() + timedelta(days=3),
        300.0
    )
    
    message = await create_message(
        test_db,
        str(rental["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        "Hello, when can I pick up the item?",
        "text"
    )
    
    assert message is not None
    assert message["content"] == "Hello, when can I pick up the item?"
    assert message["sender_id"] == renter["_id"]
    assert message["receiver_id"] == owner["_id"]
    assert message["message_type"] == "text"


@pytest.mark.asyncio
async def test_get_rental_messages(test_db, sample_item_data):
    """Test getting messages for a rental."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    from app.crud.rentals import create_rental
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        date.today() + timedelta(days=1),
        date.today() + timedelta(days=3),
        300.0
    )
    
    # Create multiple messages
    await create_message(
        test_db,
        str(rental["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        "Message 1",
        "text"
    )
    
    await create_message(
        test_db,
        str(rental["_id"]),
        str(owner["_id"]),
        str(renter["_id"]),
        "Message 2",
        "text"
    )
    
    messages = await get_rental_messages(test_db, str(rental["_id"]))
    
    assert len(messages) == 2
    assert all(msg["rental_id"] == rental["_id"] for msg in messages)


@pytest.mark.asyncio
async def test_mark_message_as_read(test_db, sample_item_data):
    """Test marking message as read."""
    from app.crud.users import create_user
    from app.crud.items import create_item
    from app.crud.rentals import create_rental
    
    owner = await create_user(test_db, "owner@example.com", "password", "Owner")
    renter = await create_user(test_db, "renter@example.com", "password", "Renter")
    item = await create_item(test_db, str(owner["_id"]), sample_item_data)
    
    rental = await create_rental(
        test_db,
        str(item["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        date.today() + timedelta(days=1),
        date.today() + timedelta(days=3),
        300.0
    )
    
    message = await create_message(
        test_db,
        str(rental["_id"]),
        str(renter["_id"]),
        str(owner["_id"]),
        "Test message",
        "text"
    )
    
    # Mark as read
    marked = await mark_message_as_read(test_db, str(message["_id"]), str(owner["_id"]))
    assert marked is True
    
    # Get message and check read_at
    messages = await get_rental_messages(test_db, str(rental["_id"]))
    read_message = next((m for m in messages if str(m["_id"]) == str(message["_id"])), None)
    assert read_message is not None
    assert read_message["read_at"] is not None


