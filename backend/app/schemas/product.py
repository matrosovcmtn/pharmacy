from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class ProductBase(BaseModel):
    name: str
    dosages: List[str]
    price: float
    quantity: int
    expiry_date: datetime
    preferred_supplier_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    dosages: Optional[List[str]] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    expiry_date: Optional[datetime] = None
    preferred_supplier_id: Optional[int] = None


class ProductInDB(ProductBase):
    id: int

    class Config:
        orm_mode = True


class Product(ProductInDB):
    pass


class ProductWithSupplier(Product):
    preferred_supplier: Optional[Dict[str, Any]] = None
