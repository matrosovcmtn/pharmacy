from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from ..db.models_auth import UserRole

# Базовая схема пользователя
class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole = UserRole.DIRECTOR
    is_active: bool = True
    supplier_id: Optional[int] = None

# Схема для создания пользователя
class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        return v

# Схема для обновления пользователя
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    supplier_id: Optional[int] = None

# Схема для отображения пользователя
class User(UserBase):
    id: int

    class Config:
        orm_mode = True

# Схема для входа пользователя
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Схема для токена доступа
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Схема для данных токена
class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
