import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Base, Pharmacy, Product, Supplier
from app.db.models_auth import User, UserRole
from app.core.config import settings
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Тестовые данные для инициализации базы данных
INITIAL_PHARMACIES = [
    {"name": "Аптека №1", "current_date": datetime.now()},
    {"name": "Аптека №2", "current_date": datetime.now()},
    {"name": "Аптека №3", "current_date": datetime.now()}
]

INITIAL_SUPPLIERS = [
    {"name": "ООО Фармацевтика"},
    {"name": "ЗАО МедПоставки"},
    {"name": "ИП Иванов"}
]

INITIAL_PRODUCTS = [
    {
        "name": "Парацетамол",
        "dosages": ["500 мг", "250 мг"],
        "price": 120.50,
        "quantity": 100,
        "expiry_date": datetime.now() + timedelta(days=365),
        "supplier_id": 1
    },
    {
        "name": "Аспирин",
        "dosages": ["100 мг", "300 мг"],
        "price": 85.75,
        "quantity": 150,
        "expiry_date": datetime.now() + timedelta(days=180),
        "supplier_id": 1
    },
    {
        "name": "Ибупрофен",
        "dosages": ["200 мг", "400 мг"],
        "price": 210.30,
        "quantity": 80,
        "expiry_date": datetime.now() + timedelta(days=730),
        "supplier_id": 2
    },
    {
        "name": "Амоксициллин",
        "dosages": ["250 мг", "500 мг", "1000 мг"],
        "price": 350.00,
        "quantity": 50,
        "expiry_date": datetime.now() + timedelta(days=365),
        "supplier_id": 2
    },
    {
        "name": "Лоратадин",
        "dosages": ["10 мг"],
        "price": 175.20,
        "quantity": 120,
        "expiry_date": datetime.now() + timedelta(days=545),
        "supplier_id": 3
    },
    {
        "name": "Омепразол",
        "dosages": ["20 мг", "40 мг"],
        "price": 280.90,
        "quantity": 60,
        "expiry_date": datetime.now() + timedelta(days=365),
        "supplier_id": 3
    }
]


def init_db(db) -> None:
    """
    Инициализация базы данных тестовыми данными
    """
    logger.info("Инициализация базы данных...")
    
    # Создание аптек
    for pharmacy_data in INITIAL_PHARMACIES:
        pharmacy = Pharmacy(**pharmacy_data)
        db.add(pharmacy)
    
    # Сохранение аптек для получения их ID
    db.commit()
    
    # Создание поставщиков
    for supplier_data in INITIAL_SUPPLIERS:
        supplier = Supplier(**supplier_data)
        db.add(supplier)
    
    # Сохранение поставщиков для получения их ID
    db.commit()
    
    # Создание товаров
    for product_data in INITIAL_PRODUCTS:
        supplier_id = product_data.pop("supplier_id")
        product = Product(**product_data)
        
        # Получение поставщика по ID
        supplier = db.get(Supplier, supplier_id)
        if supplier:
            product.preferred_supplier_id = supplier.id
        
        db.add(product)
    
    # Создание администратора по умолчанию
    admin_exists = db.query(User).filter(User.email == "admin@pharmacy.com").first()
    if not admin_exists:
        logger.info("Создание администратора по умолчанию...")
        hashed_password = get_password_hash("admin123")
        admin_user = User(
            email="admin@pharmacy.com",
            username="admin",
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
    
    # Сохранение всех изменений
    db.commit()
    
    logger.info("База данных успешно инициализирована!")


async def main() -> None:
    """
    Основная функция для запуска инициализации базы данных
    """
    logger.info("Создание начальных данных")
    async for db in get_db():
        await init_db(db)
    logger.info("Начальные данные созданы")


if __name__ == "__main__":
    asyncio.run(main())
