# utils

Вспомогательные утилиты.

**Назначение:** Переиспользуемые функции для различных задач.

**Файлы:**
- `auth.py` - утилиты аутентификации (хеширование паролей, создание/декодирование JWT токенов)
- `file_upload.py` - утилиты загрузки файлов (сохранение изображений, удаление файлов, проверка типов)

**Зависимости:**
- `passlib` для хеширования паролей
- `jose` для работы с JWT
- `uuid` для генерации уникальных имен файлов

---

## Документация

### auth.py

Утилиты для работы с аутентификацией и безопасностью.

**verify_password(plain_password: str, hashed_password: str) -> bool**
- Проверка пароля против хеша
- Использует bcrypt через passlib
- Возвращает: True если пароль верный

**get_password_hash(password: str) -> str**
- Хеширование пароля
- Использует bcrypt с автоматической генерацией salt
- Возвращает: хеш пароля в формате bcrypt

**create_access_token(data: dict, expires_delta: Optional[timedelta]) -> str**
- Создание JWT access token
- Добавляет поле `exp` (expiration time)
- Использует `access_token_expire_minutes` из настроек (по умолчанию 30 минут)
- Алгоритм: HS256
- Возвращает: закодированный JWT токен (строка)

**create_refresh_token(data: dict) -> str**
- Создание JWT refresh token
- Время жизни: `refresh_token_expire_days` из настроек (по умолчанию 7 дней)
- Добавляет поле `type: "refresh"` для различения типов токенов
- Возвращает: закодированный JWT токен (строка)

**decode_token(token: str) -> Optional[dict]**
- Декодирование и проверка JWT токена
- Проверяет подпись и срок действия
- Возвращает: payload (словарь) или None при ошибке
- Обрабатывает исключения JWTError

**Использование:**
```python
# Хеширование пароля при регистрации
password_hash = get_password_hash("user_password")

# Проверка пароля при входе
is_valid = verify_password("user_password", stored_hash)

# Создание токенов
access_token = create_access_token(data={"sub": user_id})
refresh_token = create_refresh_token(data={"sub": user_id})

# Декодирование токена
payload = decode_token(token)
user_id = payload.get("sub")
```

### file_upload.py

Утилиты для работы с загрузкой и хранением файлов.

**ensure_upload_dir(subdir: str) -> Path**
- Создание директории для загрузки файлов
- Создает структуру: `{upload_dir}/{subdir}/`
- Возвращает: Path объект созданной директории
- Автоматически создает родительские директории если не существуют

**save_uploaded_file(file: UploadFile, subdir: str) -> Optional[str]**
- Сохранение загруженного файла
- Проверяет тип файла (должен быть в `allowed_image_types`)
- Проверяет размер файла (не должен превышать `max_upload_size`)
- Генерирует уникальное имя файла через UUID
- Сохраняет файл в `{upload_dir}/{subdir}/{unique_filename}`
- Возвращает: относительный URL пути (`/static/uploads/{subdir}/{filename}`) или None при ошибке
- Обрабатывает исключения при сохранении

**delete_file(file_url: str) -> bool**
- Удаление файла по URL
- Автоматически обрабатывает пути с префиксом `/static/`
- Возвращает: True если файл удален, False при ошибке
- Безопасно обрабатывает отсутствие файла

**Использование:**
```python
# Сохранение изображения товара
file_url = await save_uploaded_file(uploaded_file, "items")
# Результат: "/static/uploads/items/uuid.jpg"

# Сохранение аватара пользователя
avatar_url = await save_uploaded_file(uploaded_file, "avatars")
# Результат: "/static/uploads/avatars/uuid.png"

# Удаление файла
deleted = delete_file("/static/uploads/items/old-image.jpg")
```

**Ограничения:**
- Максимальный размер файла: настраивается через `MAX_UPLOAD_SIZE` (по умолчанию 10MB)
- Разрешенные типы: настраиваются через `ALLOWED_IMAGE_TYPES` (jpeg, png, webp)
- Все файлы сохраняются локально на сервере в папке `uploads/`

**Структура директорий:**
```
uploads/
├── items/          # Изображения товаров
├── avatars/        # Аватары пользователей
└── messages/       # Изображения в сообщениях
```

