"""Tests for notification CRUD operations."""
import pytest
from app.crud.notifications import (
    create_notification, get_user_notifications, mark_notification_as_read
)


@pytest.mark.asyncio
async def test_create_notification(test_db):
    """Test notification creation."""
    from app.crud.users import create_user
    
    user = await create_user(test_db, "user@example.com", "password", "User")
    
    notification = await create_notification(
        test_db,
        str(user["_id"]),
        "new_rental_request",
        "New Rental Request",
        "Someone wants to rent your item"
    )
    
    assert notification is not None
    assert notification["user_id"] == user["_id"]
    assert notification["notification_type"] == "new_rental_request"
    assert notification["title"] == "New Rental Request"
    assert notification["read_at"] is None


@pytest.mark.asyncio
async def test_get_user_notifications(test_db):
    """Test getting user notifications."""
    from app.crud.users import create_user
    
    user = await create_user(test_db, "user@example.com", "password", "User")
    
    # Create multiple notifications
    await create_notification(
        test_db,
        str(user["_id"]),
        "new_rental_request",
        "Notification 1",
        "Content 1"
    )
    
    await create_notification(
        test_db,
        str(user["_id"]),
        "new_message",
        "Notification 2",
        "Content 2"
    )
    
    # Get all notifications
    notifications = await get_user_notifications(test_db, str(user["_id"]), unread_only=False)
    assert len(notifications) == 2
    
    # Get only unread
    unread = await get_user_notifications(test_db, str(user["_id"]), unread_only=True)
    assert len(unread) == 2


@pytest.mark.asyncio
async def test_mark_notification_as_read(test_db):
    """Test marking notification as read."""
    from app.crud.users import create_user
    
    user = await create_user(test_db, "user@example.com", "password", "User")
    
    notification = await create_notification(
        test_db,
        str(user["_id"]),
        "new_rental_request",
        "Test Notification",
        "Test content"
    )
    
    # Mark as read
    marked = await mark_notification_as_read(test_db, str(notification["_id"]), str(user["_id"]))
    assert marked is True
    
    # Get notifications - should not appear in unread_only
    unread = await get_user_notifications(test_db, str(user["_id"]), unread_only=True)
    assert len(unread) == 0
    
    # But should appear in all notifications
    all_notifications = await get_user_notifications(test_db, str(user["_id"]), unread_only=False)
    assert len(all_notifications) == 1
    assert all_notifications[0]["read_at"] is not None

