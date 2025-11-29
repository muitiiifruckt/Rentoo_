"""Item Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from bson import ObjectId


class ItemBase(BaseModel):
    """Base item schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: str
    price_per_day: float = Field(..., gt=0)
    price_per_week: Optional[float] = Field(None, gt=0)
    price_per_month: Optional[float] = Field(None, gt=0)
    location: Optional[Dict] = None
    parameters: Optional[Dict] = None


class ItemCreate(ItemBase):
    """Schema for item creation."""
    images: Optional[List[str]] = None


class ItemUpdate(BaseModel):
    """Schema for item update."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    price_per_day: Optional[float] = Field(None, gt=0)
    price_per_week: Optional[float] = Field(None, gt=0)
    price_per_month: Optional[float] = Field(None, gt=0)
    location: Optional[Dict] = None
    parameters: Optional[Dict] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None


class ItemResponse(ItemBase):
    """Schema for item response."""
    id: str = Field(..., alias="_id")
    owner_id: str
    images: List[str] = []
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class ItemSearch(BaseModel):
    """Schema for item search."""
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    location: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = "created_at"  # created_at, price
    sort_order: Optional[str] = "desc"  # asc, desc



