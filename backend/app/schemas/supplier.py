from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class SupplierBase(BaseModel):
    name: str


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    name: Optional[str] = None


class SupplierInDB(SupplierBase):
    id: int

    class Config:
        orm_mode = True


class Supplier(SupplierInDB):
    pass


class SupplierWithProducts(Supplier):
    products: List[Dict[str, Any]] = []
