# Система управления аптекой

Программная система для директора аптеки, обеспечивающая хранение и управление сведениями об аптеке, товарах и поставщиках.

## Описание проекта

Система предназначена для директора аптеки и обеспечивает хранение и управление следующими данными:
- Сведения об аптеке
- Сведения о товарах (наименование, цена, фасовка, срок годности, количество)
- Сведения о поставщиках и поставляемых ими товарах

Система позволяет директору аптеки закупать недостающие товары у поставщиков и списывать просроченные товары. При этом учитывается предпочтение поставщиков для различных товаров (задается цифрой 1, 2 или 3).

## Функциональные возможности

### Общие возможности
- Хранение и управление сведениями об аптеке, товарах и поставщиках
- Добавление, удаление и обновление товаров
- Закупка товаров у поставщиков с учетом предпочтений
- Списание просроченных товаров
- Отслеживание сроков годности товаров

### Роли пользователей
- **Директор**: управление аптекой, закупка товаров, списание просроченных товаров
- **Поставщик**: управление своими товарами, которые он готов продавать
- **Администратор**: полный доступ ко всем функциям системы

### Информационные запросы
- Какие товары и в каком количестве имеются в каждой аптеке
- У каких товаров и в каких аптеках закончился срок годности товара
- Какие товары можно заказать у поставщиков
- Суммарная стоимость товаров в аптеке
- У каких поставщиков и в каком количестве есть товар нужного наименования
- У какого поставщика имеется товар с заданной фасовкой

## Структура данных

### Аптека (Pharmacy)
- Идентификатор
- Название
- Текущая дата (для проверки сроков годности)
- Список товаров

### Товар (Product)
- Идентификатор
- Наименование
- Фасовка (список значений, например: "5 мг", "10 мг")
- Цена
- Количество
- Срок годности
- Предпочтительный поставщик

### Поставщик (Supplier)
- Идентификатор
- Название
- Список товаров

### Связи между таблицами
- **Аптека-Товар**: многие-ко-многим с дополнительным полем количества товара в аптеке
- **Поставщик-Товар**: многие-ко-многим с дополнительными полями количества товара у поставщика и предпочтения (1, 2 или 3)

## Технический стек
- **Backend**: Python + FastAPI
- **База данных**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Контейнеризация**: Docker и Docker Compose

## Инструкция по запуску

### Предварительные требования
- Docker и Docker Compose
- Git (опционально, для клонирования репозитория)

### Шаги для запуска
1. Клонировать репозиторий:
   ```
   git clone <url-репозитория>
   cd pharmacy
   ```

2. Запустить приложение с помощью скрипта:
   - В Windows:
     ```
     run.bat
     ```
   - В Linux/MacOS:
     ```
     chmod +x run.sh
     ./run.sh
     ```
   
   Или вручную с помощью Docker Compose:
   ```
   docker-compose up --build
   ```

3. Дождаться инициализации всех сервисов. При первом запуске это может занять некоторое время, так как Docker будет загружать необходимые образы и собирать контейнеры.

4. Открыть приложение в браузере:
   - Backend API: `http://localhost:8000`
   - Frontend: `http://localhost:3000`

5. Для входа в систему используйте следующие учетные данные:
   - Администратор:
     - Email: admin@pharmacy.com
     - Пароль: admin123
   - Директор:
     - Email: director@pharmacy.com
     - Пароль: director123
   - Поставщик:
     - Email: supplier@pharmacy.com
     - Пароль: supplier123

6. Для остановки приложения:
   - Если запущено через скрипт: нажмите Ctrl+C в терминале
   - Если запущено вручную: выполните команду `docker-compose down`

### Документация API
После запуска приложения документация API доступна по адресам:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Основные API эндпоинты

### Аптеки
- `GET /api/v1/pharmacies/` - получить список всех аптек
- `POST /api/v1/pharmacies/` - создать новую аптеку
- `GET /api/v1/pharmacies/{pharmacy_id}` - получить информацию об аптеке по ID
- `PUT /api/v1/pharmacies/{pharmacy_id}` - обновить информацию об аптеке
- `DELETE /api/v1/pharmacies/{pharmacy_id}` - удалить аптеку
- `PUT /api/v1/pharmacies/{pharmacy_id}/date` - обновить текущую дату аптеки

### Товары
- `GET /api/v1/products/` - получить список всех товаров
- `POST /api/v1/products/` - создать новый товар
- `GET /api/v1/products/{product_id}` - получить информацию о товаре по ID
- `PUT /api/v1/products/{product_id}` - обновить информацию о товаре
- `DELETE /api/v1/products/{product_id}` - удалить товар
- `GET /api/v1/products/expired/` - получить список просроченных товаров
- `GET /api/v1/products/pharmacy/{pharmacy_id}` - получить список товаров в конкретной аптеке
- `GET /api/v1/products/supplier/{supplier_id}` - получить список товаров у конкретного поставщика
- `GET /api/v1/products/dosage/{dosage}` - получить список товаров с заданной фасовкой
- `POST /api/v1/products/pharmacy/{pharmacy_id}/add/{product_id}` - добавить товар в аптеку
- `DELETE /api/v1/products/pharmacy/{pharmacy_id}/remove/{product_id}` - удалить товар из аптеки
- `GET /api/v1/products/total-cost/` - получить суммарную стоимость товаров в аптеке

### Поставщики
- `GET /api/v1/suppliers/` - получить список всех поставщиков
- `POST /api/v1/suppliers/` - создать нового поставщика
- `GET /api/v1/suppliers/{supplier_id}` - получить информацию о поставщике по ID
- `PUT /api/v1/suppliers/{supplier_id}` - обновить информацию о поставщике
- `DELETE /api/v1/suppliers/{supplier_id}` - удалить поставщика
- `GET /api/v1/suppliers/product/{product_id}` - получить список поставщиков, у которых есть заданный товар
- `GET /api/v1/suppliers/product-name/{product_name}` - получить список поставщиков, у которых есть товар с заданным наименованием
- `GET /api/v1/suppliers/product-dosage/{dosage}` - получить список поставщиков, у которых есть товар с заданной фасовкой
- `POST /api/v1/suppliers/{supplier_id}/add-product/{product_id}` - добавить товар к поставщику
- `DELETE /api/v1/suppliers/{supplier_id}/remove-product/{product_id}` - удалить товар у поставщика

## Структура проекта
```
pharmacy/
├── backend/                  # Серверная часть приложения
│   ├── app/                  # Код приложения
│   │   ├── api/              # API endpoints
│   │   │   ├── api.py        # Объединение всех API-маршрутов
│   │   │   ├── deps.py       # Зависимости для API (авторизация)
│   │   │   └── endpoints/    # Конечные точки API
│   │   │       ├── auth.py   # API для аутентификации
│   │   │       ├── pharmacy.py  # API для аптек
│   │   │       ├── product.py   # API для товаров
│   │   │       ├── supplier.py  # API для поставщиков
│   │   │       └── user.py      # API для пользователей
│   │   ├── core/             # Конфигурация и настройки
│   │   │   └── config.py     # Настройки приложения
│   │   ├── db/               # Модели базы данных
│   │   │   ├── database.py   # Настройка подключения к БД
│   │   │   ├── init_db.py    # Инициализация БД
│   │   │   ├── models.py     # SQLAlchemy модели
│   │   │   └── models_auth.py # Модели аутентификации
│   │   ├── schemas/          # Pydantic модели
│   │   │   ├── pharmacy.py   # Схемы для аптек
│   │   │   ├── product.py    # Схемы для товаров
│   │   │   ├── supplier.py   # Схемы для поставщиков
│   │   │   └── user.py       # Схемы для пользователей
│   │   ├── services/         # Бизнес-логика
│   │   │   ├── pharmacy.py   # Сервисы для аптек
│   │   │   ├── product.py    # Сервисы для товаров
│   │   │   ├── supplier.py   # Сервисы для поставщиков
│   │   │   └── user.py       # Сервисы для пользователей
│   │   └── main.py           # Основной файл приложения
│   ├── Dockerfile            # Dockerfile для серверной части
│   └── requirements.txt      # Зависимости Python
├── frontend/                 # Клиентская часть приложения
│   ├── static/               # Статические файлы
│   │   ├── css/              # CSS стили
│   │   │   ├── bootstrap.min.css # Bootstrap
│   │   │   └── styles.css    # Основные стили приложения
│   │   └── js/               # JavaScript файлы
│   │       ├── auth.js       # Функции аутентификации
│   │       ├── bootstrap.bundle.min.js # Bootstrap
│   │       ├── main.js       # Общие функции JavaScript
│   │       ├── pharmacy.js   # Скрипт для страницы аптек
│   │       ├── products.js   # Скрипт для страницы товаров
│   │       └── suppliers.js  # Скрипт для страницы поставщиков
│   ├── templates/            # HTML шаблоны
│   │   ├── index.html        # Главная страница
│   │   ├── login.html        # Страница входа
│   │   ├── pharmacy.html     # Страница управления аптеками
│   │   ├── products.html     # Страница управления товарами
│   │   ├── profile.html      # Страница профиля пользователя
│   │   ├── register.html     # Страница регистрации
│   │   ├── suppliers.html    # Страница управления поставщиками
│   │   └── users.html        # Страница управления пользователями
│   └── Dockerfile            # Dockerfile для клиентской части
├── docker-compose.yml        # Конфигурация Docker Compose
├── run.bat                   # Скрипт запуска для Windows
├── run.sh                    # Скрипт запуска для Linux/MacOS
└── README.md                 # Документация проекта
```
