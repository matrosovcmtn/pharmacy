from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...db.database import get_db
from ...db.models_auth import User
from ...schemas.pharmacy import Pharmacy, PharmacyCreate, PharmacyUpdate
from ...services import pharmacy as pharmacy_service
from ..deps import get_current_active_user, check_director_permission, check_admin_permission
from ...db.models_auth import UserRole

router = APIRouter()


@router.get("/", response_model=List[Pharmacy])
def read_pharmacies(
    skip: int = Query(0, description="Количество записей для пропуска"),
    limit: int = Query(100, description="Максимальное количество записей для возврата"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получить список всех аптек"""
    pharmacies = pharmacy_service.get_pharmacies(db, current_user=current_user, skip=skip, limit=limit)
    return pharmacies


@router.post("/", response_model=Pharmacy)
def create_pharmacy(
    pharmacy: PharmacyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_director_permission)
):
    """Создать новую аптеку (только для директоров и администраторов)"""
    return pharmacy_service.create_pharmacy(db=db, pharmacy=pharmacy, current_user=current_user)


@router.get("/{pharmacy_id}", response_model=Pharmacy)
def read_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получить информацию об аптеке по ID"""
    db_pharmacy = pharmacy_service.get_pharmacy(db, pharmacy_id=pharmacy_id)
    if db_pharmacy is None:
        raise HTTPException(status_code=404, detail="Аптека не найдена")
    return db_pharmacy


@router.put("/{pharmacy_id}", response_model=Pharmacy)
def update_pharmacy(
    pharmacy_id: int,
    pharmacy: PharmacyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_director_permission)
):
    """Обновить информацию об аптеке (только для директоров и администраторов)"""
    db_pharmacy = pharmacy_service.update_pharmacy(db, pharmacy_id=pharmacy_id, pharmacy=pharmacy, current_user=current_user)
    if db_pharmacy is None:
        raise HTTPException(status_code=404, detail="Аптека не найдена или нет доступа")
    return db_pharmacy


@router.delete("/{pharmacy_id}")
def delete_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Удалить аптеку (директор может только свою, админ — любую)"""
    success = pharmacy_service.delete_pharmacy(db, pharmacy_id=pharmacy_id, current_user=current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Аптека не найдена или нет доступа")
    return {"detail": "Аптека успешно удалена"}


@router.patch("/{pharmacy_id}/assign-director")
def assign_director_to_pharmacy(
    pharmacy_id: int,
    director_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    """Назначить директору аптеку (только для админов)"""
    pharmacy = pharmacy_service.get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Аптека не найдена")
    director = db.query(User).filter(User.id == director_id, User.role == UserRole.DIRECTOR).first()
    if not director:
        raise HTTPException(status_code=404, detail="Директор не найден")
    pharmacy.director_id = director_id
    db.commit()
    db.refresh(pharmacy)
    return pharmacy

@router.patch("/{pharmacy_id}/unassign-director")
def unassign_director_from_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    """Отвязать аптеку от директора (только для админов)"""
    pharmacy = pharmacy_service.get_pharmacy(db, pharmacy_id)
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Аптека не найдена")
    pharmacy.director_id = None
    db.commit()
    db.refresh(pharmacy)
    return pharmacy

@router.put("/{pharmacy_id}/date", response_model=Pharmacy)
def update_pharmacy_date(
    pharmacy_id: int,
    new_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_director_permission)
):
    """Обновить текущую дату аптеки (только для директоров и администраторов)"""
    db_pharmacy = pharmacy_service.update_pharmacy_date(db, pharmacy_id=pharmacy_id, new_date=new_date)
    if db_pharmacy is None:
        raise HTTPException(status_code=404, detail="Аптека не найдена")
    return db_pharmacy
