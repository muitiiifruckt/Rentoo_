# crud

CRUD операции для работы с MongoDB.

**Назначение:** Бизнес-логика работы с данными, абстракция над MongoDB операциями.

**Файлы:**
- `users.py` - операции с пользователями (создание, получение, обновление, проверка пароля)
- `items.py` - операции с товарами (CRUD, поиск, получение товаров пользователя)
- `rentals.py` - операции с бронированиями (создание, обновление статуса, проверка доступности)
- `categories.py` - операции с категориями (получение, создание)
- `messages.py` - операции с сообщениями (создание, получение, отметка прочитанным)
- `notifications.py` - операции с уведомлениями (создание, получение, отметка прочитанным)

**Паттерн:** Все функции асинхронные, принимают `db` (AsyncIOMotorDatabase) и возвращают словари или списки словарей.

---

## Документация

### users.py

**get_user_by_email(db, email: str) -> Optional[dict]**
- Поиск пользователя по email
- Возвращает: словарь с данными пользователя или None

**get_user_by_id(db, user_id: str) -> Optional[dict]**
- Поиск пользователя по ID
- Валидирует ObjectId перед запросом
- Возвращает: словарь с данными пользователя или None

**create_user(db, email: str, password: str, name: str) -> dict**
- Создание нового пользователя
- Автоматически хеширует пароль через bcrypt
- Устанавливает `created_at` и `updated_at`
- Возвращает: словарь с данными созданного пользователя

**update_user(db, user_id: str, update_data: dict) -> Optional[dict]**
- Обновление данных пользователя
- Автоматически обновляет `updated_at`
- Возвращает: обновленный словарь или None если не найден

**verify_user_password(user: dict, password: str) -> bool**
- Проверка пароля пользователя
- Сравнивает plain password с password_hash через bcrypt
- Возвращает: True если пароль верный

### items.py

**get_item_by_id(db, item_id: str) -> Optional[dict]**
- Получение товара по ID
- Валидирует ObjectId
- Возвращает: словарь с данными товара или None

**create_item(db, owner_id: str, item_data: dict) -> dict**
- Создание нового товара
- Требует валидный owner_id
- Устанавливает статус "draft" по умолчанию
- Возвращает: словарь с данными созданного товара

**update_item(db, item_id: str, owner_id: str, update_data: dict) -> Optional[dict]**
- Обновление товара
- Проверяет владельца перед обновлением
- Автоматически обновляет `updated_at`
- Возвращает: обновленный словарь или None

**delete_item(db, item_id: str, owner_id: str) -> bool**
- Удаление товара
- Проверяет владельца перед удалением
- Возвращает: True если удален, False если не найден или не владелец

**search_items(db, search_params: ItemSearch) -> List[dict]**
- Поиск товаров с фильтрами
- Поддерживает: текстовый поиск, фильтр по категории, цене, локации
- Возвращает только товары со статусом "active"
- Поддерживает пагинацию и сортировку
- Возвращает: список словарей с товарами

**get_user_items(db, owner_id: str) -> List[dict]**
- Получение всех товаров пользователя
- Возвращает: список словарей с товарами (до 1000)

### rentals.py

**get_rental_by_id(db, rental_id: str) -> Optional[dict]**
- Получение бронирования по ID
- Возвращает: словарь с данными бронирования или None

**create_rental(db, item_id, renter_id, owner_id, start_date, end_date, total_price) -> dict**
- Создание заявки на бронирование
- Устанавливает статус "pending"
- Возвращает: словарь с данными созданного бронирования

**update_rental_status(db, rental_id, owner_id, status) -> Optional[dict]**
- Обновление статуса бронирования
- Проверяет владельца перед обновлением
- При статусе "confirmed" автоматически обновляет календарь доступности
- Возвращает: обновленный словарь или None

**get_user_rentals(db, user_id: str, role: str) -> List[dict]**
- Получение бронирований пользователя
- `role`: "renter" - как арендатор, "owner" - как владелец, "all" - все
- Сортировка: по дате создания (новые сначала)
- Возвращает: список словарей с бронированиями (до 1000)

**check_item_availability(db, item_id, start_date, end_date) -> bool**
- Проверка доступности товара на указанные даты
- Проверяет пересечения с существующими подтвержденными/активными бронированиями
- Возвращает: True если доступен, False если занят

**_update_availability_for_rental(db, rental_id, item_id, start_date, end_date, available)**
- Внутренняя функция для обновления календаря доступности
- Обновляет все даты в диапазоне start_date - end_date
- Использует upsert для создания/обновления записей

### categories.py

**get_all_categories(db) -> List[dict]**
- Получение всех категорий
- Возвращает: список словарей с категориями (до 1000)

**get_category_by_slug(db, slug: str) -> Optional[dict]**
- Поиск категории по slug
- Возвращает: словарь с данными категории или None

**create_category(db, name: str, slug: str, description: str) -> dict**
- Создание новой категории
- Возвращает: словарь с данными созданной категории

### messages.py

**create_message(db, rental_id, sender_id, receiver_id, content, message_type) -> dict**
- Создание нового сообщения
- Устанавливает `message_type` (по умолчанию "text")
- Возвращает: словарь с данными созданного сообщения

**get_rental_messages(db, rental_id: str) -> List[dict]**
- Получение всех сообщений для бронирования
- Сортировка: по дате создания (старые сначала)
- Возвращает: список словарей с сообщениями (до 1000)

**mark_message_as_read(db, message_id: str, user_id: str) -> bool**
- Отметка сообщения прочитанным
- Проверяет, что user_id является получателем
- Устанавливает `read_at` в текущее время
- Возвращает: True если обновлено, False если не найдено

### notifications.py

**create_notification(db, user_id, notification_type, title, content) -> dict**
- Создание нового уведомления
- Возвращает: словарь с данными созданного уведомления

**get_user_notifications(db, user_id: str, unread_only: bool) -> List[dict]**
- Получение уведомлений пользователя
- `unread_only`: True - только непрочитанные, False - все
- Сортировка: по дате создания (новые сначала)
- Возвращает: список словарей с уведомлениями (до 1000)

**mark_notification_as_read(db, notification_id: str, user_id: str) -> bool**
- Отметка уведомления прочитанным
- Проверяет, что user_id является владельцем уведомления
- Устанавливает `read_at` в текущее время
- Возвращает: True если обновлено, False если не найдено

