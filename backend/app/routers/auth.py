"""Authentication routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.database import get_database
from app.crud.users import create_user, get_user_by_email, verify_user_password
from app.utils.auth import create_access_token, create_refresh_token
from app.dependencies import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register a new user."""
    # Check if user exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = await create_user(
        db,
        email=user_data.email,
        password=user_data.password,
        name=user_data.name
    )
    
    # Convert ObjectId to string for response
    user["_id"] = str(user["_id"])
    user["id"] = str(user["_id"])  # Also add id field for Pydantic
    
    return user


@router.post("/login")
async def login(
    user_data: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login user and return tokens."""
    logger.info(f"Login attempt: email={user_data.email}")
    # Get user
    user = await get_user_by_email(db, user_data.email)
    if not user:
        logger.warning(f"Login failed: user not found for email={user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    # Verify password
    if not verify_user_password(user, user_data.password):
        logger.warning(f"Login failed: invalid password for email={user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    logger.info(f"Login successful: user_id={user.get('_id')}")
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user["_id"])})
    refresh_token = create_refresh_token(data={"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user.get("avatar_url")
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information."""
    current_user["_id"] = str(current_user["_id"])
    current_user["id"] = str(current_user["_id"])  # Also add id field for Pydantic
    return current_user

