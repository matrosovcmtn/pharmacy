from sqlalchemy.orm import Session
from ..db.models import Pharmacy
from ..schemas.pharmacy import PharmacyCreate, PharmacyUpdate
from typing import List, Optional
from datetime import datetime


def get_pharmacy(db: Session, pharmacy_id: int) -> Optional[Pharmacy]:
    """Получить аптеку по ID"""
    return db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()


def get_pharmacies(db: Session, skip: int = 0, limit: int = 100) -> List[Pharmacy]:
    """Получить список аптек с пагинацией"""
    return db.query(Pharmacy).offset(skip).limit(limit).all()


def create_pharmacy(db: Session, pharmacy: PharmacyCreate) -> Pharmacy:
    """Создать новую аптеку"""
    db_pharmacy = Pharmacy(**pharmacy.dict())
    db.add(db_pharmacy)
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy


def update_pharmacy(db: Session, pharmacy_id: int, pharmacy: PharmacyUpdate) -> Optional[Pharmacy]:
    """Обновить данные аптеки"""
    db_pharmacy = get_pharmacy(db, pharmacy_id)
    if not db_pharmacy:
        return None
    
    update_data = pharmacy.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pharmacy, key, value)
    
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy


def delete_pharmacy(db: Session, pharmacy_id: int) -> bool:
    """Удалить аптеку"""
    db_pharmacy = get_pharmacy(db, pharmacy_id)
    if not db_pharmacy:
        return False
    
    db.delete(db_pharmacy)
    db.commit()
    return True


def update_pharmacy_date(db: Session, pharmacy_id: int, new_date: datetime) -> Optional[Pharmacy]:
    """Обновить текущую дату аптеки"""
    db_pharmacy = get_pharmacy(db, pharmacy_id)
    if not db_pharmacy:
        return None
    
    db_pharmacy.current_date = new_date
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy
