"""Rental routes."""
import logging
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

logger = logging.getLogger(__name__)


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
    logger.info(f"Creating rental request: item_id={rental_data.item_id}, user_id={current_user.get('_id')}, start_date={rental_data.start_date}, end_date={rental_data.end_date}")
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
    logger.info(f"Getting item: {rental_data.item_id}")
    item = await get_item_by_id(db, rental_data.item_id)
    if not item:
        logger.warning(f"Item not found: {rental_data.item_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    logger.info(f"Item found: {item.get('title')}, owner_id={item.get('owner_id')}, status={item.get('status')}")
    
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
    logger.info(f"Checking availability for item {rental_data.item_id} from {rental_data.start_date} to {rental_data.end_date}")
    is_available = await check_item_availability(
        db, rental_data.item_id, rental_data.start_date, rental_data.end_date
    )
    logger.info(f"Availability check result: {is_available}")
    if not is_available:
        logger.warning(f"Item {rental_data.item_id} is not available for selected dates")
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
    logger.info(f"Creating rental with total_price={total_price}")
    rental = await create_rental(
        db,
        rental_data.item_id,
        str(current_user["_id"]),
        str(item["owner_id"]),
        rental_data.start_date,
        rental_data.end_date,
        total_price
    )
    logger.info(f"Rental created: _id={rental.get('_id')}")
    
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
    # Ensure dates are properly serialized
    if "start_date" in rental and hasattr(rental["start_date"], "isoformat"):
        rental["start_date"] = rental["start_date"].isoformat()
    if "end_date" in rental and hasattr(rental["end_date"], "isoformat"):
        rental["end_date"] = rental["end_date"].isoformat()
    if "created_at" in rental and hasattr(rental["created_at"], "isoformat"):
        rental["created_at"] = rental["created_at"].isoformat()
    if "updated_at" in rental and hasattr(rental["updated_at"], "isoformat"):
        rental["updated_at"] = rental["updated_at"].isoformat()
    return rental


@router.get("", response_model=List[RentalResponse])
async def list_rentals(
    role: str = "all",  # all, renter, owner
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's rentals."""
    logger.info(f"Listing rentals: user_id={current_user.get('_id')}, role={role}")
    rentals = await get_user_rentals(db, str(current_user["_id"]), role)
    logger.info(f"Found {len(rentals)} rentals")
    for rental in rentals:
        rental["_id"] = str(rental["_id"])
        rental["id"] = str(rental["_id"])  # Also add id field for Pydantic
        rental["item_id"] = str(rental["item_id"])
        rental["renter_id"] = str(rental["renter_id"])
        rental["owner_id"] = str(rental["owner_id"])
        # Ensure dates are properly serialized
        if "start_date" in rental and hasattr(rental["start_date"], "isoformat"):
            rental["start_date"] = rental["start_date"].isoformat()
        if "end_date" in rental and hasattr(rental["end_date"], "isoformat"):
            rental["end_date"] = rental["end_date"].isoformat()
        if "created_at" in rental and hasattr(rental["created_at"], "isoformat"):
            rental["created_at"] = rental["created_at"].isoformat()
        if "updated_at" in rental and hasattr(rental["updated_at"], "isoformat"):
            rental["updated_at"] = rental["updated_at"].isoformat()
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
    # Ensure dates are properly serialized
    if "start_date" in rental and hasattr(rental["start_date"], "isoformat"):
        rental["start_date"] = rental["start_date"].isoformat()
    if "end_date" in rental and hasattr(rental["end_date"], "isoformat"):
        rental["end_date"] = rental["end_date"].isoformat()
    if "created_at" in rental and hasattr(rental["created_at"], "isoformat"):
        rental["created_at"] = rental["created_at"].isoformat()
    if "updated_at" in rental and hasattr(rental["updated_at"], "isoformat"):
        rental["updated_at"] = rental["updated_at"].isoformat()
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
    updated_rental["id"] = str(updated_rental["_id"])  # Also add id field for Pydantic
    updated_rental["item_id"] = str(updated_rental["item_id"])
    updated_rental["renter_id"] = str(updated_rental["renter_id"])
    updated_rental["owner_id"] = str(updated_rental["owner_id"])
    # Ensure dates are properly serialized
    if "start_date" in updated_rental and hasattr(updated_rental["start_date"], "isoformat"):
        updated_rental["start_date"] = updated_rental["start_date"].isoformat()
    if "end_date" in updated_rental and hasattr(updated_rental["end_date"], "isoformat"):
        updated_rental["end_date"] = updated_rental["end_date"].isoformat()
    if "created_at" in updated_rental and hasattr(updated_rental["created_at"], "isoformat"):
        updated_rental["created_at"] = updated_rental["created_at"].isoformat()
    if "updated_at" in updated_rental and hasattr(updated_rental["updated_at"], "isoformat"):
        updated_rental["updated_at"] = updated_rental["updated_at"].isoformat()
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
    updated_rental["id"] = str(updated_rental["_id"])  # Also add id field for Pydantic
    updated_rental["item_id"] = str(updated_rental["item_id"])
    updated_rental["renter_id"] = str(updated_rental["renter_id"])
    updated_rental["owner_id"] = str(updated_rental["owner_id"])
    # Ensure dates are properly serialized
    if "start_date" in updated_rental and hasattr(updated_rental["start_date"], "isoformat"):
        updated_rental["start_date"] = updated_rental["start_date"].isoformat()
    if "end_date" in updated_rental and hasattr(updated_rental["end_date"], "isoformat"):
        updated_rental["end_date"] = updated_rental["end_date"].isoformat()
    if "created_at" in updated_rental and hasattr(updated_rental["created_at"], "isoformat"):
        updated_rental["created_at"] = updated_rental["created_at"].isoformat()
    if "updated_at" in updated_rental and hasattr(updated_rental["updated_at"], "isoformat"):
        updated_rental["updated_at"] = updated_rental["updated_at"].isoformat()
    return updated_rental

