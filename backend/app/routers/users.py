"""User routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserResponse, UserUpdate
from app.dependencies import get_current_user
from app.database import get_database
from app.crud.users import get_user_by_id, update_user
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user by ID."""
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user["_id"] = str(user["_id"])
    user["id"] = str(user["_id"])  # Also add id field for Pydantic
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user profile."""
    # Check if user is updating their own profile
    if str(current_user["_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_dict = user_data.dict(exclude_unset=True)
    if not update_dict:
        return current_user
    
    updated_user = await update_user(db, user_id, update_dict)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    updated_user["_id"] = str(updated_user["_id"])
    updated_user["id"] = str(updated_user["_id"])  # Also add id field for Pydantic
    return updated_user

