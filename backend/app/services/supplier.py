from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from ..db.models import Supplier, Product
from ..schemas.supplier import SupplierCreate, SupplierUpdate
from typing import List, Optional


def get_supplier(db: Session, supplier_id: int) -> Optional[Supplier]:
    """Получить поставщика по ID"""
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def get_suppliers(db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
    """Получить список поставщиков, у которых есть связанный пользователь с ролью 'поставщик' (SUPPLIER)"""
    from ..db.models_auth import User, UserRole
    return db.query(Supplier).join(User, Supplier.user_id == User.id).filter(User.role == UserRole.SUPPLIER).offset(skip).limit(limit).all()


def create_supplier(db: Session, supplier: SupplierCreate) -> Supplier:
    """Создать нового поставщика"""
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def update_supplier(db: Session, supplier_id: int, supplier: SupplierUpdate) -> Optional[Supplier]:
    """Обновить данные поставщика"""
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return None
    
    update_data = supplier.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def delete_supplier(db: Session, supplier_id: int) -> bool:
    """Удалить поставщика"""
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return False
    
    db.delete(db_supplier)
    db.commit()
    return True


def get_suppliers_by_product(db: Session, product_id: int) -> List[Supplier]:
    """Получить список поставщиков, у которых есть заданный товар"""
    return db.query(Supplier).join(Supplier.products).filter(Product.id == product_id).all()


def get_suppliers_by_product_name(db: Session, product_name: str) -> List[Supplier]:
    """Получить список поставщиков, у которых есть товар с заданным наименованием"""
    return db.query(Supplier).join(Supplier.products).filter(Product.name == product_name).all()


def get_suppliers_by_product_dosage(db: Session, dosage: str) -> List[Supplier]:
    """Получить список поставщиков, у которых есть товар с заданной фасовкой"""
    # Примечание: это упрощенная реализация, в реальном приложении 
    # нужно использовать специальные операторы PostgreSQL для работы с JSON
    suppliers = db.query(Supplier).all()
    result = []
    
    for supplier in suppliers:
        for product in supplier.products:
            if dosage in product.dosages:
                result.append(supplier)
                break
    
    return result


def add_product_to_supplier(db: Session, product_id: int, supplier_id: int, quantity: int, preference: int = 1) -> int:
    """Добавить товар к поставщику
    
    Возвращает:
        1 - успешно
        0 - товар или поставщик не найдены
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    db_supplier = get_supplier(db, supplier_id)
    
    if not db_product or not db_supplier:
        return 0
    
    # Проверяем, есть ли уже этот товар у поставщика
    product_exists = False
    for p in db_supplier.products:
        if p.id == db_product.id:
            product_exists = True
            break
    
    if not product_exists:
        # Добавляем товар к поставщику
        db_supplier.products.append(db_product)
    
    # Обновляем количество и предпочтение в таблице связи
    db.execute(
        text("UPDATE supplier_product SET quantity = :quantity, preference = :preference WHERE supplier_id = :supplier_id AND product_id = :product_id"),
        {"quantity": quantity, "preference": preference, "supplier_id": supplier_id, "product_id": product_id}
    )
    
    db.commit()
    return 1


def remove_product_from_supplier(db: Session, product_id: int, supplier_id: int) -> bool:
    """Удалить товар у поставщика"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    db_supplier = get_supplier(db, supplier_id)
    
    if not db_product or not db_supplier:
        return False
    
    if db_supplier in db_product.suppliers:
        db_supplier.products.remove(db_product)
        db.commit()
        return True
    
    return False
