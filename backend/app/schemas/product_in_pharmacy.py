from pydantic import BaseModel
from typing import List, Any
from datetime import datetime

class ProductInPharmacy(BaseModel):
    id: int
    name: str
    dosages: List[str]
    price: float
    expiry_date: datetime
    quantity_in_pharmacy: int

    class Config:
        orm_mode = True
