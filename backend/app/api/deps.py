from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional

from ..core.config import settings
from ..db.database import get_db
from ..db.models_auth import User, UserRole
from ..schemas.user import TokenData
from ..services import user as user_service

# Настройка OAuth2 с использованием пароля
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Получить текущего пользователя по токену
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Декодируем JWT токен
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        
        if username is None or user_id is None:
            raise credentials_exception
        
        token_data = TokenData(username=username, user_id=user_id, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    
    # Получаем пользователя из базы данных
    user = user_service.get_user(db, user_id=token_data.user_id)
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь неактивен"
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Получить текущего активного пользователя
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь неактивен"
        )
    
    return current_user

def check_admin_permission(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Проверить, является ли пользователь администратором
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )
    
    return current_user

def check_director_permission(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Проверить, является ли пользователь директором или администратором
    """
    if current_user.role not in [UserRole.DIRECTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )
    
    return current_user

def check_supplier_permission(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Проверить, является ли пользователь поставщиком
    """
    if current_user.role != UserRole.SUPPLIER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )
    
    return current_user

def check_supplier_or_admin_permission(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Проверить, является ли пользователь поставщиком или администратором
    """
    if current_user.role not in [UserRole.SUPPLIER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )
    
    return current_user
