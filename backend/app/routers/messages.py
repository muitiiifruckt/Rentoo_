"""Message routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.message import MessageCreate, MessageResponse
from app.dependencies import get_current_user
from app.database import get_database
from app.crud.messages import create_message, get_rental_messages, mark_message_as_read
from app.crud.rentals import get_rental_by_id
from app.crud.notifications import create_notification
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Send a message."""
    # Verify rental exists and user is involved
    rental = await get_rental_by_id(db, message_data.rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if (str(rental["renter_id"]) != str(current_user["_id"]) and
            str(rental["owner_id"]) != str(current_user["_id"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send message for this rental"
        )
    
    # Verify receiver is the other party
    if message_data.receiver_id not in [str(rental["renter_id"]), str(rental["owner_id"])]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid receiver"
        )
    
    if message_data.receiver_id == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    # Create message
    message = await create_message(
        db,
        message_data.rental_id,
        str(current_user["_id"]),
        message_data.receiver_id,
        message_data.content,
        message_data.message_type
    )
    
    # Create notification for receiver
    await create_notification(
        db,
        message_data.receiver_id,
        "new_message",
        "Новое сообщение",
        f"Новое сообщение от {current_user['name']}"
    )
    
    message["_id"] = str(message["_id"])
    message["id"] = str(message["_id"])  # Also add id field for Pydantic
    message["rental_id"] = str(message["rental_id"])
    message["sender_id"] = str(message["sender_id"])
    message["receiver_id"] = str(message["receiver_id"])
    return message


@router.get("/rental/{rental_id}", response_model=List[MessageResponse])
async def get_messages(
    rental_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get messages for a rental."""
    # Verify rental exists and user is involved
    rental = await get_rental_by_id(db, rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if (str(rental["renter_id"]) != str(current_user["_id"]) and
            str(rental["owner_id"]) != str(current_user["_id"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view messages for this rental"
        )
    
    messages = await get_rental_messages(db, rental_id)
    for message in messages:
        message["_id"] = str(message["_id"])
        message["id"] = str(message["_id"])  # Also add id field for Pydantic
        message["rental_id"] = str(message["rental_id"])
        message["sender_id"] = str(message["sender_id"])
        message["receiver_id"] = str(message["receiver_id"])
    return messages


@router.put("/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_message_read(
    message_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark message as read."""
    marked = await mark_message_as_read(db, message_id, str(current_user["_id"]))
    if not marked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not authorized"
        )

