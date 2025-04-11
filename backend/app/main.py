from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import os
import logging
import asyncio
import sys
from pathlib import Path

from .api.api import api_router
from .core.config import settings
from .db.database import engine, get_db
from .db.models import Base
from .db.init_db import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание таблиц в базе данных
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любых источников для разработки
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API-эндпоинтов
app.include_router(api_router, prefix=settings.API_V1_STR)

# Настройка статических файлов и шаблонов
static_dir = "/app/static" if os.path.exists("/app/static") else "../frontend/static"
templates_dir = "/app/templates" if os.path.exists("/app/templates") else "../frontend/templates"

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

logger.info(f"Используются статические файлы из: {static_dir}")
logger.info(f"Используются шаблоны из: {templates_dir}")

# Маршруты фронтенда
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/profile", response_class=HTMLResponse)
async def profile(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

@app.get("/users", response_class=HTMLResponse)
async def users(request: Request):
    return templates.TemplateResponse("users.html", {"request": request})

@app.get("/pharmacy", response_class=HTMLResponse)
async def pharmacy(request: Request):
    return templates.TemplateResponse("pharmacy.html", {"request": request})

@app.get("/products", response_class=HTMLResponse)
async def products(request: Request):
    return templates.TemplateResponse("products.html", {"request": request})

@app.get("/suppliers", response_class=HTMLResponse)
async def suppliers(request: Request):
    return templates.TemplateResponse("suppliers.html", {"request": request})


@app.get("/health")
async def health_check():
    """Проверка работоспособности приложения"""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_db_client():
    """Инициализация базы данных при запуске приложения"""
    try:
        logger.info("Проверка наличия данных в базе данных...")
        # Проверяем, есть ли данные в базе
        db = next(get_db())
        
        from sqlalchemy import select
        from .db.models import Pharmacy
        from .db.models_auth import User
        
        # Проверяем наличие администратора
        admin_result = db.execute(select(User).filter(User.email == "admin@pharmacy.com"))
        admin_exists = admin_result.scalars().first()
        
        # Проверяем наличие аптек
        pharmacy_result = db.execute(select(Pharmacy))
        pharmacies = pharmacy_result.scalars().all()
        
        # Если администратора нет или аптек нет, инициализируем базу данных
        if not admin_exists or not pharmacies:
            if not admin_exists:
                logger.info("Администратор не найден. Инициализация базы данных...")
            if not pharmacies:
                logger.info("Аптеки не найдены. Инициализация базы данных...")
                
            # Вызываем init_db без await, так как мы используем синхронный API
            init_db(db)
        else:
            logger.info(f"База данных уже содержит данные (администратор: {admin_exists is not None}, аптек: {len(pharmacies)})")
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        raise
