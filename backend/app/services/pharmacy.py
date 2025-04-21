from sqlalchemy.orm import Session
from ..db.models import Pharmacy
from ..schemas.pharmacy import PharmacyCreate, PharmacyUpdate
from typing import List, Optional
from datetime import datetime


def get_pharmacy(db: Session, pharmacy_id: int) -> Optional[Pharmacy]:
    """Получить аптеку по ID"""
    return db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()


def get_pharmacies(db: Session, current_user=None, skip: int = 0, limit: int = 100) -> List[Pharmacy]:
    """Получить список аптек с пагинацией. Директор видит только свои аптеки."""
    query = db.query(Pharmacy)
    if current_user and hasattr(current_user, 'role') and getattr(current_user, 'role', None) == 'director':
        query = query.filter(Pharmacy.director_id == current_user.id)
    return query.offset(skip).limit(limit).all()


def create_pharmacy(db: Session, pharmacy: PharmacyCreate, current_user=None) -> Pharmacy:
    """Создать новую аптеку. Директору автоматически назначается director_id."""
    data = pharmacy.dict()
    if current_user and hasattr(current_user, 'role') and getattr(current_user, 'role', None) == 'director':
        data['director_id'] = current_user.id
    db_pharmacy = Pharmacy(**data)
    db.add(db_pharmacy)
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy


def update_pharmacy(db: Session, pharmacy_id: int, pharmacy: PharmacyUpdate, current_user=None) -> Optional[Pharmacy]:
    """Обновить данные аптеки. Директор может обновлять только свои аптеки."""
    db_pharmacy = get_pharmacy(db, pharmacy_id)
    if not db_pharmacy:
        return None
    if current_user and hasattr(current_user, 'role') and getattr(current_user, 'role', None) == 'director':
        if db_pharmacy.director_id != current_user.id:
            return None
    update_data = pharmacy.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pharmacy, key, value)
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy


def delete_pharmacy(db: Session, pharmacy_id: int, current_user=None) -> bool:
    """Удалить аптеку. Директор может удалять только свои аптеки."""
    db_pharmacy = get_pharmacy(db, pharmacy_id)
    if not db_pharmacy:
        return False
    if current_user and hasattr(current_user, 'role') and getattr(current_user, 'role', None) == 'director':
        if db_pharmacy.director_id != current_user.id:
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
