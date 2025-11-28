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

Файл `.env` уже создан с дефолтными значениями. При необходимости отредактируйте его:

**Важные настройки:**
- `MONGODB_URL` - URL вашей MongoDB (по умолчанию `mongodb://localhost:27017`)
- `MONGODB_DB_NAME` - имя базы данных (по умолчанию `rentoo`)
- `SECRET_KEY` - секретный ключ для JWT (**обязательно измените в продакшене!**)
- `DEBUG` - режим отладки (по умолчанию `False`)

**Дефолтные значения:**
- База данных: `mongodb://localhost:27017`
- Имя БД: `rentoo`
- Токены: 30 минут (access), 7 дней (refresh)
- Загрузка файлов: до 10MB, форматы jpeg/png/webp
- CORS: разрешены все источники (`*`)

6. **Установите и запустите MongoDB:**

**Windows:**
- Скачайте MongoDB Community Server с официального сайта: https://www.mongodb.com/try/download/community
- Выберите версию для Windows и установите (рекомендуется установить как службу Windows)
- Или используйте MongoDB через Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Linux (Ubuntu/Debian):**
```bash
# Установка MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запуск MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
# Установка через Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Проверка работы MongoDB:**
```bash
# Подключение к MongoDB
mongosh

# Или проверка через Python
python -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017').admin.command('ping')"
```

**Если MongoDB не запущена как служба, запустите вручную:**
```bash
# Windows (если установлена не как служба)
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"

# Linux/macOS
mongod --dbpath /data/db
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

## Инициализация категорий

Перед использованием приложения необходимо создать категории в базе данных. Для этого запустите скрипт инициализации:

```bash
# Убедитесь, что виртуальное окружение активировано
python scripts/init_categories.py
```

Скрипт создаст следующие категории по умолчанию:
- Электроника
- Спорт и отдых
- Инструменты
- Бытовая техника
- Одежда и аксессуары
- Мебель
- Транспорт
- Другое

**Важно:** Скрипт проверяет наличие категорий и не создает дубликаты. Если категории уже существуют, скрипт просто выведет их список.

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

