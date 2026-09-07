"""
Pydantic schemas for category module.
"""

from pydantic import BaseModel, Field
from typing import Optional


class CategoryCreate(BaseModel):
    """
    Schema for creating a category.
    """
    name: str = Field(..., example="Helmet")
    parent_category_type: Optional[str] = Field(None, example="Safety")
    tracking_type: str = Field(..., example="QUANTITY")
    requires_inspection: bool = False
    inspection_frequency_months: Optional[int] = None
    product_life_year: Optional[float] = None
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_category_type: Optional[str] = None
    tracking_type: Optional[str] = None
    requires_inspection: Optional[bool] = None
    inspection_frequency_months: Optional[int] = None
    product_life_year: Optional[float] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    """
    Schema for returning category data.
    """
    id: int
    name: str
    tracking_type: str
    requires_inspection: bool
    inspection_frequency_months: Optional[int]
    product_life_year: Optional[float]
    description: Optional[str]

    class Config:
        from_attributes = True