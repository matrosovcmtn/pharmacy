from fastapi import APIRouter
from .endpoints import pharmacy, product, supplier, auth, users

api_router = APIRouter()

# Подключение эндпоинтов для аутентификации
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

# Подключение эндпоинтов для управления пользователями
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# Подключение эндпоинтов для аптек
api_router.include_router(
    pharmacy.router,
    prefix="/pharmacies",
    tags=["pharmacies"]
)

# Подключение эндпоинтов для товаров
api_router.include_router(
    product.router,
    prefix="/products",
    tags=["products"]
)

# Подключение эндпоинтов для поставщиков
api_router.include_router(
    supplier.router,
    prefix="/suppliers",
    tags=["suppliers"]
)
