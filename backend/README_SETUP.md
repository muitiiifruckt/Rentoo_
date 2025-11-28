# Rentoo Backend - Инструкция по установке и запуску

## Требования

- Python 3.10+
- MongoDB 4.4+
- pip

## Установка

1. **Клонируйте репозиторий и перейдите в папку backend:**
```bash
cd backend
```

2. **Создайте виртуальное окружение:**
```bash
python -m venv venv
```

3. **Активируйте виртуальное окружение:**
- Windows:
```bash
venv\Scripts\activate
```
- Linux/Mac:
```bash
source venv/bin/activate
```

4. **Установите зависимости:**
```bash
pip install -r requirements.txt
```

5. **Настройте переменные окружения:**
Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите:
- `MONGODB_URL` - URL вашей MongoDB (по умолчанию `mongodb://localhost:27017`)
- `SECRET_KEY` - секретный ключ для JWT (используйте длинную случайную строку)
- Другие настройки при необходимости

6. **Убедитесь, что MongoDB запущена:**
```bash
# Проверьте, что MongoDB работает
mongosh
```

## Запуск

### Режим разработки

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Приложение будет доступно по адресу: `http://localhost:8000`

### Режим продакшена

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Документация

После запуска приложения документация доступна по адресам:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Точка входа FastAPI
│   ├── config.py            # Конфигурация
│   ├── database.py          # Подключение к MongoDB
│   ├── dependencies.py      # FastAPI зависимости
│   ├── models/              # MongoDB модели
│   ├── schemas/             # Pydantic схемы
│   ├── routers/             # API роуты
│   ├── crud/                # CRUD операции
│   └── utils/               # Утилиты
├── uploads/                 # Загруженные файлы (создается автоматически)
├── requirements.txt         # Зависимости
└── README.md               # Документация проекта
```

## Основные API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Пользователи
- `GET /api/users/{user_id}` - Профиль пользователя
- `PUT /api/users/{user_id}` - Обновление профиля

### Товары (Items)
- `GET /api/items` - Поиск товаров
- `POST /api/items` - Создание объявления
- `GET /api/items/{item_id}` - Детали товара
- `PUT /api/items/{item_id}` - Обновление товара
- `DELETE /api/items/{item_id}` - Удаление товара
- `POST /api/items/{item_id}/images` - Загрузка изображения

### Бронирования (Rentals)
- `GET /api/rentals` - Список бронирований
- `POST /api/rentals` - Создание заявки
- `GET /api/rentals/{rental_id}` - Детали бронирования
- `PUT /api/rentals/{rental_id}/confirm` - Подтверждение/отклонение
- `PUT /api/rentals/{rental_id}/complete` - Завершение аренды

### Сообщения
- `GET /api/messages/rental/{rental_id}` - История сообщений
- `POST /api/messages` - Отправка сообщения
- `PUT /api/messages/{message_id}/read` - Отметка прочитанным

### Уведомления
- `GET /api/notifications` - Список уведомлений
- `PUT /api/notifications/{notification_id}/read` - Отметка прочитанным

### Категории
- `GET /api/categories` - Список категорий

## Тестирование

Для тестирования API можно использовать:
- Swagger UI: `http://localhost:8000/docs`
- Postman
- curl

Пример регистрации пользователя:
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Пример входа:
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Примечания

- Все изображения сохраняются в папке `uploads/` и доступны по пути `/static/uploads/...`
- JWT токены используются для аутентификации, передавайте их в заголовке `Authorization: Bearer <token>`
- Для продакшена обязательно измените `SECRET_KEY` на безопасный случайный ключ

