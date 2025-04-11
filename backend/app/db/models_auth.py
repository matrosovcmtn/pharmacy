from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from .models import Base

# Определение ролей пользователей
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DIRECTOR = "director"
    SUPPLIER = "supplier"

# Таблица пользователей
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.DIRECTOR)
    is_active = Column(Boolean, default=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    
    # Отношения
    supplier = relationship("Supplier", foreign_keys=[supplier_id])
