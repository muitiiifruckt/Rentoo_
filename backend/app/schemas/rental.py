"""Rental Pydantic schemas."""
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from bson import ObjectId


class RentalBase(BaseModel):
    """Base rental schema."""
    item_id: str
    start_date: date
    end_date: date


class RentalCreate(RentalBase):
    """Schema for rental creation."""
    pass


class RentalUpdate(BaseModel):
    """Schema for rental update."""
    status: Optional[str] = None


class RentalResponse(RentalBase):
    """Schema for rental response."""
    id: str = Field(..., alias="_id")
    renter_id: str
    owner_id: str
    total_price: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class RentalConfirm(BaseModel):
    """Schema for rental confirmation."""
    confirm: bool = True

