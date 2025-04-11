from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from ..db.models_auth import User, UserRole
from ..schemas.user import UserCreate, UserUpdate
from ..core.security import get_password_hash, verify_password

def get_user(db: Session, user_id: int) -> Optional[User]:
    """Получить пользователя по ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Получить пользователя по email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Получить пользователя по имени пользователя"""
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Получить список всех пользователей"""
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    """Создать нового пользователя"""
    # Хешируем пароль перед сохранением
    hashed_password = get_password_hash(user.password)
    
    # Создаем объект пользователя
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        is_active=user.is_active,
        supplier_id=user.supplier_id
    )
    
    # Добавляем в базу данных
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate) -> Optional[User]:
    """Обновить информацию о пользователе"""
    db_user = get_user(db, user_id)
    
    if not db_user:
        return None
    
    # Обновляем поля, если они предоставлены
    update_data = user.dict(exclude_unset=True)
    
    # Если предоставлен новый пароль, хешируем его
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Обновляем поля пользователя
    for key, value in update_data.items():
        if hasattr(db_user, key) and value is not None:
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    """Удалить пользователя"""
    db_user = get_user(db, user_id)
    
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    
    return True

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Аутентифицировать пользователя"""
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user
