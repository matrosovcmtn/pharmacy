from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ...db.database import get_db
from ...schemas.supplier import Supplier, SupplierCreate, SupplierUpdate, SupplierWithLogin
from ...services import supplier as supplier_service
from ..deps import check_admin_permission
from ...db.models_auth import User

router = APIRouter()


@router.get("/", response_model=List[SupplierWithLogin])
def read_suppliers(
    skip: int = Query(0, description="Количество записей для пропуска"),
    limit: int = Query(100, description="Максимальное количество записей для возврата"),
    db: Session = Depends(get_db)
):
    """Получить список всех поставщиков c логином (email)"""
    suppliers = supplier_service.get_suppliers(db, skip=skip, limit=limit)
    # Each supplier has a .user relationship, which has an email
    result = []
    for supplier in suppliers:
        login = supplier.user.email if supplier.user else ''
        supplier_with_login = SupplierWithLogin(
            id=supplier.id,
            name=supplier.name,
            login=login
        )
        result.append(supplier_with_login)
    return result


@router.post("/", response_model=Supplier)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    """Создать нового поставщика (только для администратора)"""
    return supplier_service.create_supplier(db=db, supplier=supplier)


@router.get("/{supplier_id}", response_model=Supplier)
def read_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Получить информацию о поставщике по ID"""
    db_supplier = supplier_service.get_supplier(db, supplier_id=supplier_id)
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Поставщик не найден")
    return db_supplier


@router.put("/{supplier_id}", response_model=Supplier)
def update_supplier(
    supplier_id: int,
    supplier: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_permission)
):
    """Обновить информацию о поставщике (только для администратора)"""
    db_supplier = supplier_service.update_supplier(db, supplier_id=supplier_id, supplier=supplier)
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Поставщик не найден")
    return db_supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Удалить поставщика"""
    success = supplier_service.delete_supplier(db, supplier_id=supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Поставщик не найден")
    return {"detail": "Поставщик успешно удален"}


@router.get("/product/{product_id}", response_model=List[Supplier])
def read_suppliers_by_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Получить список поставщиков, у которых есть заданный товар"""
    suppliers = supplier_service.get_suppliers_by_product(db, product_id=product_id)
    return suppliers


@router.get("/product-name/{product_name}", response_model=List[Supplier])
def read_suppliers_by_product_name(
    product_name: str,
    db: Session = Depends(get_db)
):
    """Получить список поставщиков, у которых есть товар с заданным наименованием"""
    suppliers = supplier_service.get_suppliers_by_product_name(db, product_name=product_name)
    return suppliers


@router.get("/product-dosage/{dosage}", response_model=List[Supplier])
def read_suppliers_by_product_dosage(
    dosage: str,
    db: Session = Depends(get_db)
):
    """Получить список поставщиков, у которых есть товар с заданной фасовкой"""
    suppliers = supplier_service.get_suppliers_by_product_dosage(db, dosage=dosage)
    return suppliers


@router.post("/{supplier_id}/add-product/{product_id}")
def add_product_to_supplier(
    supplier_id: int,
    product_id: int,
    quantity: int,
    preference: int = 1,
    db: Session = Depends(get_db)
):
    """Добавить товар к поставщику"""
    if preference not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Предпочтение должно быть 1, 2 или 3")
    
    result = supplier_service.add_product_to_supplier(
        db, product_id=product_id, supplier_id=supplier_id, 
        quantity=quantity, preference=preference
    )
    if result == 0:
        raise HTTPException(status_code=404, detail="Товар или поставщик не найдены")
    return {"detail": "Товар успешно добавлен к поставщику"}


@router.delete("/{supplier_id}/remove-product/{product_id}")
def remove_product_from_supplier(
    supplier_id: int,
    product_id: int,
    db: Session = Depends(get_db)
):
    """Удалить товар у поставщика"""
    success = supplier_service.remove_product_from_supplier(
        db, product_id=product_id, supplier_id=supplier_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Товар или поставщик не найдены")
    return {"detail": "Товар успешно удален у поставщика"}
