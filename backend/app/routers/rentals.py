"""Rental routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.rental import RentalCreate, RentalResponse, RentalUpdate, RentalConfirm
from app.dependencies import get_current_user
from app.database import get_database
from app.crud.rentals import (
    create_rental, get_rental_by_id, update_rental_status,
    get_user_rentals, check_item_availability
)
from app.crud.items import get_item_by_id
from app.crud.notifications import create_notification
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import date, timedelta


router = APIRouter(prefix="/api/rentals", tags=["rentals"])


def calculate_total_price(price_per_day: float, start_date: date, end_date: date) -> float:
    """Calculate total price for rental period."""
    days = (end_date - start_date).days + 1
    return price_per_day * days


@router.post("", response_model=RentalResponse, status_code=status.HTTP_201_CREATED)
async def create_rental_request(
    rental_data: RentalCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a rental request."""
    # Validate dates
    if rental_data.start_date >= rental_data.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    if rental_data.start_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be in the past"
        )
    
    # Get item
    item = await get_item_by_id(db, rental_data.item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is not available for rental"
        )
    
    # Check if user is trying to rent their own item
    if str(item["owner_id"]) == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot rent your own item"
        )
    
    # Check availability
    is_available = await check_item_availability(
        db, rental_data.item_id, rental_data.start_date, rental_data.end_date
    )
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is not available for selected dates"
        )
    
    # Calculate price
    total_price = calculate_total_price(
        item["price_per_day"],
        rental_data.start_date,
        rental_data.end_date
    )
    
    # Create rental
    rental = await create_rental(
        db,
        rental_data.item_id,
        str(current_user["_id"]),
        str(item["owner_id"]),
        rental_data.start_date,
        rental_data.end_date,
        total_price
    )
    
    # Create notification for owner
    await create_notification(
        db,
        str(item["owner_id"]),
        "new_rental_request",
        "Новая заявка на аренду",
        f"Пользователь {current_user['name']} хочет арендовать ваш товар '{item['title']}'"
    )
    
    rental["_id"] = str(rental["_id"])
    rental["id"] = str(rental["_id"])  # Also add id field for Pydantic
    rental["item_id"] = str(rental["item_id"])
    rental["renter_id"] = str(rental["renter_id"])
    rental["owner_id"] = str(rental["owner_id"])
    return rental


@router.get("", response_model=List[RentalResponse])
async def list_rentals(
    role: str = "all",  # all, renter, owner
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's rentals."""
    rentals = await get_user_rentals(db, str(current_user["_id"]), role)
    for rental in rentals:
        rental["_id"] = str(rental["_id"])
        rental["id"] = str(rental["_id"])  # Also add id field for Pydantic
        rental["item_id"] = str(rental["item_id"])
        rental["renter_id"] = str(rental["renter_id"])
        rental["owner_id"] = str(rental["owner_id"])
    return rentals


@router.get("/{rental_id}", response_model=RentalResponse)
async def get_rental(
    rental_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get rental by ID."""
    rental = await get_rental_by_id(db, rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if user is involved in this rental
    if (str(rental["renter_id"]) != str(current_user["_id"]) and
            str(rental["owner_id"]) != str(current_user["_id"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this rental"
        )
    
    rental["_id"] = str(rental["_id"])
    rental["id"] = str(rental["_id"])  # Also add id field for Pydantic
    rental["item_id"] = str(rental["item_id"])
    rental["renter_id"] = str(rental["renter_id"])
    rental["owner_id"] = str(rental["owner_id"])
    return rental


@router.put("/{rental_id}/confirm", response_model=RentalResponse)
async def confirm_rental(
    rental_id: str,
    confirm_data: RentalConfirm,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Confirm or reject rental request."""
    rental = await get_rental_by_id(db, rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if user is the owner
    if str(rental["owner_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can confirm rental"
        )
    
    if rental["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rental is not in pending status"
        )
    
    # Update status
    new_status = "confirmed" if confirm_data.confirm else "cancelled"
    updated_rental = await update_rental_status(db, rental_id, str(current_user["_id"]), new_status)
    
    if not updated_rental:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update rental"
        )
    
    # Create notification for renter
    await create_notification(
        db,
        str(rental["renter_id"]),
        "rental_confirmed" if confirm_data.confirm else "rental_rejected",
        "Заявка обработана",
        f"Ваша заявка на аренду {'подтверждена' if confirm_data.confirm else 'отклонена'}"
    )
    
    updated_rental["_id"] = str(updated_rental["_id"])
    updated_rental["item_id"] = str(updated_rental["item_id"])
    updated_rental["renter_id"] = str(updated_rental["renter_id"])
    updated_rental["owner_id"] = str(updated_rental["owner_id"])
    return updated_rental


@router.put("/{rental_id}/complete", response_model=RentalResponse)
async def complete_rental(
    rental_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark rental as completed."""
    rental = await get_rental_by_id(db, rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if user is involved
    if (str(rental["renter_id"]) != str(current_user["_id"]) and
            str(rental["owner_id"]) != str(current_user["_id"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if rental["status"] not in ["confirmed", "in_progress"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rental cannot be completed from current status"
        )
    
    updated_rental = await update_rental_status(db, rental_id, str(rental["owner_id"]), "completed")
    
    if not updated_rental:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update rental"
        )
    
    updated_rental["_id"] = str(updated_rental["_id"])
    updated_rental["item_id"] = str(updated_rental["item_id"])
    updated_rental["renter_id"] = str(updated_rental["renter_id"])
    updated_rental["owner_id"] = str(updated_rental["owner_id"])
    return updated_rental

