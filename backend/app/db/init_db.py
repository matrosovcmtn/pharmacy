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

# Динамически формируемых поставщиков больше нет — они создаются на основе пользователей с ролью SUPPLIER

SUPPLIER_USERS = [
    {"email": "supplier@pharmacy.com", "username": "supplier", "password": "supplier123", "supplier_name": "ООО ДефолтПоставщик"},
    {"email": "supplier1@pharmacy.com", "username": "supplier1", "password": "supplier123", "supplier_name": "ООО Фармацевтика"},
    {"email": "supplier2@pharmacy.com", "username": "supplier2", "password": "supplier123", "supplier_name": "ЗАО МедПоставки"},
    {"email": "supplier3@pharmacy.com", "username": "supplier3", "password": "supplier123", "supplier_name": "ИП Иванов"},
    {"email": "supplier4@pharmacy.com", "username": "supplier4", "password": "supplier123", "supplier_name": "ООО НоваяФарма"},
    {"email": "supplier5@pharmacy.com", "username": "supplier5", "password": "supplier123", "supplier_name": "ООО НовыйПоставщик"}
]

# Каждый товар будет привязан к одному из поставщиков (по индексу)
INITIAL_PRODUCTS = [
    {
        "name": "Парацетамол",
        "dosages": ["500 мг", "250 мг"],
        "price": 120.50,
        "quantity": 1000,
        "expiry_date": datetime.now() + timedelta(days=365)
    },
    {
        "name": "Аспирин",
        "dosages": ["100 мг", "300 мг"],
        "price": 85.75,
        "quantity": 1000,
        "expiry_date": datetime.now() + timedelta(days=180)
    },
    {
        "name": "Ибупрофен",
        "dosages": ["200 мг", "400 мг"],
        "price": 210.30,
        "quantity": 1000,
        "expiry_date": datetime.now() + timedelta(days=730)
    },
    {
        "name": "Амоксициллин",
        "dosages": ["250 мг", "500 мг", "1000 мг"],
        "price": 350.00,
        "quantity": 1000,
        "expiry_date": datetime.now() + timedelta(days=365)
    },
    {
        "name": "Лоратадин",
        "dosages": ["10 мг"],
        "price": 175.20,
        "quantity": 1000,
        "expiry_date": datetime.now() + timedelta(days=545)
    },
    {
        "name": "Омепразол",
        "dosages": ["20 мг", "40 мг"],
        "price": 280.90,
        "quantity": 1000,
        "expiry_date": datetime.now() + timedelta(days=365)
    },
    # Товары для нового поставщика
    {
        "name": "Цефтриаксон",
        "dosages": ["1 г"],
        "price": 450.00,
        "quantity": 500,
        "expiry_date": datetime.now() + timedelta(days=400)
    },
    {
        "name": "Диклофенак",
        "dosages": ["50 мг"],
        "price": 90.00,
        "quantity": 500,
        "expiry_date": datetime.now() + timedelta(days=300)
    }
]


def init_db(db) -> None:
    """
    Инициализация базы данных тестовыми данными
    """
    logger.info("Инициализация базы данных...")
    
    # --- Создание пользователей (с проверкой на существование) ---
    admin_user = db.query(User).filter(User.email == "admin@pharmacy.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@pharmacy.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
    director1_user = db.query(User).filter(User.email == "director@pharmacy.com").first()
    if not director1_user:
        director1_user = User(
            email="director@pharmacy.com",
            username="director",
            hashed_password=get_password_hash("director123"),
            role=UserRole.DIRECTOR,
            is_active=True
        )
        db.add(director1_user)
    director2_user = db.query(User).filter(User.email == "director2@pharmacy.com").first()
    if not director2_user:
        director2_user = User(
            email="director2@pharmacy.com",
            username="director2",
            hashed_password=get_password_hash("director2"),
            role=UserRole.DIRECTOR,
            is_active=True
        )
        db.add(director2_user)
    
    db.commit()

    # Получаем id директоров
    director1 = db.query(User).filter(User.email == "director@pharmacy.com").first()
    director2 = db.query(User).filter(User.email == "director2@pharmacy.com").first()
    director1_id = director1.id if director1 else 1
    director2_id = director2.id if director2 else 2

    # --- Создание аптек ---
    db.query(Pharmacy).delete()  # очистка аптек для повторной инициализации
    for idx, pharmacy_data in enumerate(INITIAL_PHARMACIES):
        if idx < 2:
            director_id = director2_id
        else:
            director_id = director1_id
        pharmacy = Pharmacy(
            name=pharmacy_data["name"],
            current_date=pharmacy_data["current_date"],
            director_id=director_id
        )
        db.add(pharmacy)
    db.commit()

    # --- Создание пользователей-поставщиков и Supplier ---
    db.query(Supplier).delete()  # очистка поставщиков
    supplier_email_to_id = {}
    for supplier_user_info in SUPPLIER_USERS:
        # Создаем пользователя с ролью SUPPLIER, если не существует
        user = db.query(User).filter(User.email == supplier_user_info["email"]).first()
        if not user:
            user = User(
                email=supplier_user_info["email"],
                username=supplier_user_info["username"],
                hashed_password=get_password_hash(supplier_user_info["password"]),
                role=UserRole.SUPPLIER,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        # Создаем Supplier, связанного с этим пользователем
        supplier = db.query(Supplier).filter(Supplier.user_id == user.id).first()
        if not supplier:
            supplier = Supplier(
                name=supplier_user_info["supplier_name"],
                user_id=user.id
            )
            db.add(supplier)
            db.commit()
            db.refresh(supplier)
        supplier_email_to_id[supplier_user_info["email"]] = supplier.id

    # --- Создание продуктов ---
    db.query(Product).delete()  # очистка продуктов для повторной инициализации
    # Привязываем товары к поставщикам по индексу (или по заранее заданному правилу)
    # Привязка товаров к поставщикам: первые 2 — первому, следующие 2 — второму, следующие 2 — третьему, последние 2 — пятому
    supplier_assignment = [0,0,1,1,2,2,4,4]  # индексы SUPPLIER_USERS для каждого товара
    for idx, product_data in enumerate(INITIAL_PRODUCTS):
        supplier_idx = supplier_assignment[idx] if idx < len(supplier_assignment) else idx % len(SUPPLIER_USERS)
        supplier_email = SUPPLIER_USERS[supplier_idx]["email"]
        supplier_id = supplier_email_to_id[supplier_email]
        dosages = product_data.get("dosages")
        if not dosages or not isinstance(dosages, list):
            dosages = ["100 мг"]
        product = Product(
            name=product_data["name"],
            dosages=dosages,
            price=product_data["price"],
            quantity=product_data["quantity"],
            expiry_date=product_data["expiry_date"],
            preferred_supplier_id=supplier_id
        )
        db.add(product)
    db.commit()

    logger.info("База данных успешно инициализирована тестовыми пользователями, аптеками, поставщиками и продуктами.")
    


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
