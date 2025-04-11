FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Создаем директории для статических файлов
RUN mkdir -p /app/static/css /app/static/js /app/templates

# Копируем файлы бэкенда
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
