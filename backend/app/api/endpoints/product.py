from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...db.database import get_db
from ...schemas.product import Product, ProductCreate, ProductUpdate, ProductWithSupplier
from ...services import product as product_service

router = APIRouter()


@router.get("/", response_model=List[Product])
def read_products(
    skip: int = Query(0, description="Количество записей для пропуска"),
    limit: int = Query(100, description="Максимальное количество записей для возврата"),
    db: Session = Depends(get_db)
):
    """Получить список всех товаров"""
    products = product_service.get_products(db, skip=skip, limit=limit)
    return products


@router.post("/", response_model=Product)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """Создать новый товар"""
    return product_service.create_product(db=db, product=product)


@router.get("/{product_id}", response_model=Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Получить информацию о товаре по ID"""
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return db_product


@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Обновить информацию о товаре"""
    db_product = product_service.update_product(db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return db_product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Удалить товар"""
    success = product_service.delete_product(db, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return {"detail": "Товар успешно удален"}


@router.get("/expired/", response_model=List[Product])
def read_expired_products(
    pharmacy_id: Optional[int] = None,
    current_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Получить список просроченных товаров"""
    expired_products = product_service.get_expired_products(
        db, pharmacy_id=pharmacy_id, current_date=current_date
    )
    return expired_products


@router.get("/pharmacy/{pharmacy_id}", response_model=List[Product])
def read_products_by_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db)
):
    """Получить список товаров в конкретной аптеке"""
    products = product_service.get_products_by_pharmacy(db, pharmacy_id=pharmacy_id)
    return products


@router.get("/supplier/{supplier_id}", response_model=List[Product])
def read_products_by_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Получить список товаров у конкретного поставщика"""
    products = product_service.get_products_by_supplier(db, supplier_id=supplier_id)
    return products


@router.get("/dosage/{dosage}", response_model=List[Product])
def read_products_by_dosage(
    dosage: str,
    db: Session = Depends(get_db)
):
    """Получить список товаров с заданной фасовкой"""
    products = product_service.get_products_by_dosage(db, dosage=dosage)
    return products


@router.post("/pharmacy/{pharmacy_id}/add/{product_id}")
def add_product_to_pharmacy(
    pharmacy_id: int,
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    """Добавить товар в аптеку"""
    result = product_service.add_product_to_pharmacy(
        db, product_id=product_id, pharmacy_id=pharmacy_id, quantity=quantity
    )
    if result == 0:
        raise HTTPException(status_code=404, detail="Товар или аптека не найдены")
    elif result == -1:
        raise HTTPException(status_code=400, detail="Недостаточно товара в наличии. Попытка добавить больше товара, чем есть в наличии")
    return {"detail": "Товар успешно добавлен в аптеку"}


@router.delete("/pharmacy/{pharmacy_id}/remove/{product_id}")
def remove_product_from_pharmacy(
    pharmacy_id: int,
    product_id: int,
    db: Session = Depends(get_db)
):
    """Удалить товар из аптеки"""
    success = product_service.remove_product_from_pharmacy(
        db, product_id=product_id, pharmacy_id=pharmacy_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Товар или аптека не найдены")
    return {"detail": "Товар успешно удален из аптеки"}


@router.get("/total-cost/", response_model=float)
def get_total_products_cost(
    pharmacy_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Получить суммарную стоимость товаров в аптеке"""
    total_cost = product_service.get_total_products_cost(db, pharmacy_id=pharmacy_id)
    return total_cost
