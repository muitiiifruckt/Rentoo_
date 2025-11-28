"""Notification routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.notification import NotificationResponse
from app.dependencies import get_current_user
from app.database import get_database
from app.crud.notifications import (
    get_user_notifications, mark_notification_as_read
)
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user notifications."""
    notifications = await get_user_notifications(
        db, str(current_user["_id"]), unread_only
    )
    for notification in notifications:
        notification["_id"] = str(notification["_id"])
        notification["user_id"] = str(notification["user_id"])
    return notifications


@router.put("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark notification as read."""
    marked = await mark_notification_as_read(
        db, notification_id, str(current_user["_id"])
    )
    if not marked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or not authorized"
        )

