from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class PharmacyBase(BaseModel):
    name: str
    director_id: Optional[int] = None


class PharmacyCreate(PharmacyBase):
    pass


class PharmacyUpdate(PharmacyBase):
    name: Optional[str] = None
    current_date: Optional[datetime] = None
    director_id: Optional[int] = None


class PharmacyInDB(PharmacyBase):
    id: int
    current_date: datetime

    class Config:
        orm_mode = True


class Pharmacy(PharmacyInDB):
    pass
