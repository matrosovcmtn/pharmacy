from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from ..db.models import Product, Pharmacy, Supplier
from ..schemas.product import ProductCreate, ProductUpdate
from typing import List, Optional
from datetime import datetime


def get_product(db: Session, product_id: int) -> Optional[Product]:
    """Получить товар по ID"""
    return db.query(Product).filter(Product.id == product_id).first()


def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    """Получить список товаров с пагинацией"""
    return db.query(Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: ProductCreate) -> Product:
    """Создать новый товар"""
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product: ProductUpdate) -> Optional[Product]:
    """Обновить данные товара"""
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    """Удалить товар"""
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    
    db.delete(db_product)
    db.commit()
    return True


def get_expired_products(db: Session, pharmacy_id: Optional[int] = None, current_date: Optional[datetime] = None) -> List[Product]:
    """Получить список просроченных товаров"""
    if current_date is None:
        current_date = datetime.now()
    
    query = db.query(Product).filter(Product.expiry_date < current_date)
    
    if pharmacy_id:
        # Фильтрация по аптеке
        query = query.join(Product.pharmacies).filter(Pharmacy.id == pharmacy_id)
    
    return query.all()


def get_products_by_pharmacy(db: Session, pharmacy_id: int) -> List[Product]:
    """Получить список товаров в конкретной аптеке"""
    return db.query(Product).join(Product.pharmacies).filter(Pharmacy.id == pharmacy_id).all()


def get_products_by_supplier(db: Session, supplier_id: int) -> List[Product]:
    """Получить список товаров у конкретного поставщика"""
    return db.query(Product).join(Product.suppliers).filter(Supplier.id == supplier_id).all()


def get_products_by_dosage(db: Session, dosage: str) -> List[Product]:
    """Получить список товаров с заданной фасовкой"""
    # Поиск товаров, у которых в массиве фасовок есть заданная фасовка
    # Примечание: это упрощенная реализация, в реальном приложении 
    # нужно использовать специальные операторы PostgreSQL для работы с JSON
    products = db.query(Product).all()
    return [p for p in products if dosage in p.dosages]


def add_product_to_pharmacy(db: Session, product_id: int, pharmacy_id: int, quantity: int) -> int:
    """Добавить товар в аптеку
    
    Возвращает:
        1 - успешно
        0 - товар или аптека не найдены
        -1 - недостаточно товара в наличии
    """
    db_product = get_product(db, product_id)
    db_pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    
    if not db_product or not db_pharmacy:
        return 0
    
    # Проверяем, что количество не превышает доступное
    if quantity > db_product.quantity:
        return -1  # Недостаточно товара в наличии
    
    # Проверяем, есть ли уже этот товар в аптеке
    product_exists = False
    for p in db_pharmacy.products:
        if p.id == db_product.id:
            product_exists = True
            break
    
    if not product_exists:
        # Добавляем товар в аптеку
        db_pharmacy.products.append(db_product)
    
    # Обновляем количество в таблице связи
    db.execute(
        text("UPDATE pharmacy_product SET quantity = :quantity WHERE pharmacy_id = :pharmacy_id AND product_id = :product_id"),
        {"quantity": quantity, "pharmacy_id": pharmacy_id, "product_id": product_id}
    )
    
    db.commit()
    return 1


def remove_product_from_pharmacy(db: Session, product_id: int, pharmacy_id: int) -> bool:
    """Удалить товар из аптеки"""
    db_product = get_product(db, product_id)
    db_pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    
    if not db_product or not db_pharmacy:
        return False
    
    if db_pharmacy in db_product.pharmacies:
        db_pharmacy.products.remove(db_product)
        db.commit()
        return True
    
    return False


def get_total_products_cost(db: Session, pharmacy_id: Optional[int] = None) -> float:
    """Получить суммарную стоимость товаров в аптеке"""
    if pharmacy_id:
        products = get_products_by_pharmacy(db, pharmacy_id)
    else:
        products = get_products(db)
    
    total_cost = 0.0
    for product in products:
        total_cost += product.price * product.quantity
    
    return total_cost
