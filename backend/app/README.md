# app

Корневая папка приложения FastAPI.

**Содержит:**
- `main.py` - точка входа, инициализация FastAPI приложения, подключение роутеров
- `config.py` - настройки приложения (БД, безопасность, файлы)
- `database.py` - подключение к MongoDB через Motor
- `dependencies.py` - FastAPI зависимости для аутентификации

---

## Документация

### main.py

Главный файл приложения. Инициализирует FastAPI, настраивает CORS, подключает роутеры, управляет жизненным циклом приложения.

**События:**
- `startup` - подключение к MongoDB при запуске
- `shutdown` - закрытие соединения с MongoDB при остановке

**Endpoints:**
- `GET /` - корневой endpoint с информацией о API
- `GET /health` - проверка работоспособности

**Статические файлы:**
- Монтирует папку `uploads/` как `/static/` для доступа к загруженным файлам

### config.py

Управление конфигурацией через Pydantic Settings. Поддерживает загрузку из переменных окружения и `.env` файла.

**Основные настройки:**
- `mongodb_url` - URL подключения к MongoDB
- `mongodb_db_name` - имя базы данных
- `secret_key` - секретный ключ для JWT (обязательно изменить в продакшене)
- `access_token_expire_minutes` - время жизни access token
- `upload_dir` - директория для загрузки файлов
- `max_upload_size` - максимальный размер файла (по умолчанию 10MB)
- `allowed_image_types` - разрешенные типы изображений

### database.py

Менеджер подключения к MongoDB через асинхронный драйвер Motor.

**Класс Database:**
- `client` - экземпляр AsyncIOMotorClient
- `database` - экземпляр базы данных

**Функции:**
- `connect_to_mongo()` - установка соединения
- `close_mongo_connection()` - закрытие соединения
- `get_database()` - получение экземпляра базы данных

### dependencies.py

FastAPI зависимости для аутентификации и авторизации.

**Функции:**
- `get_current_user()` - получение текущего аутентифицированного пользователя из JWT токена
- `get_optional_current_user()` - получение пользователя, если аутентифицирован (опционально)

**Использование:**
```python
@router.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    # current_user содержит данные пользователя из БД
    pass
```

