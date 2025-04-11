from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os

# Создаем роутер для фронтенда
router = APIRouter()

# Определяем путь к шаблонам
templates_path = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_path)

# Маршрут для главной страницы
@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Маршрут для страницы входа
@router.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

# Маршрут для страницы регистрации
@router.get("/register", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

# Маршрут для страницы профиля пользователя
@router.get("/profile", response_class=HTMLResponse)
async def profile(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

# Маршрут для страницы управления пользователями (только для администраторов)
@router.get("/users", response_class=HTMLResponse)
async def users(request: Request):
    return templates.TemplateResponse("users.html", {"request": request})

# Маршрут для страницы аптек
@router.get("/pharmacy", response_class=HTMLResponse)
async def pharmacy(request: Request):
    return templates.TemplateResponse("pharmacy.html", {"request": request})

# Маршрут для страницы товаров
@router.get("/products", response_class=HTMLResponse)
async def products(request: Request):
    return templates.TemplateResponse("products.html", {"request": request})

# Маршрут для страницы поставщиков
@router.get("/suppliers", response_class=HTMLResponse)
async def suppliers(request: Request):
    return templates.TemplateResponse("suppliers.html", {"request": request})
