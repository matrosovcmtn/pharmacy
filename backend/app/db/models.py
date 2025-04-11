from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, DateTime, JSON, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

# Таблица связи между аптекой и товарами
pharmacy_product = Table(
    'pharmacy_product',
    Base.metadata,
    Column('pharmacy_id', Integer, ForeignKey('pharmacies.id'), primary_key=True),
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True),
    Column('quantity', Integer, default=0),
)

# Таблица связи между поставщиком и товарами
supplier_product = Table(
    'supplier_product',
    Base.metadata,
    Column('supplier_id', Integer, ForeignKey('suppliers.id'), primary_key=True),
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True),
    Column('quantity', Integer, default=0),
    Column('preference', Integer, default=1),  # Предпочтение поставщика (1, 2 или 3)
)


class Pharmacy(Base):
    __tablename__ = 'pharmacies'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    current_date = Column(DateTime, default=datetime.datetime.now)
    
    # Отношения
    products = relationship("Product", secondary=pharmacy_product, back_populates="pharmacies")


class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    dosages = Column(JSON)  # Массив фасовок
    price = Column(Float)
    quantity = Column(Integer, default=0)
    expiry_date = Column(DateTime)
    preferred_supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=True)
    
    # Отношения
    pharmacies = relationship("Pharmacy", secondary=pharmacy_product, back_populates="products")
    suppliers = relationship("Supplier", secondary=supplier_product, back_populates="products")
    preferred_supplier = relationship("Supplier", foreign_keys=[preferred_supplier_id])


class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # Отношения
    products = relationship("Product", secondary=supplier_product, back_populates="suppliers")
