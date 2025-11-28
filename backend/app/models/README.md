# models

MongoDB модели данных.

**Назначение:** Определение структуры документов для коллекций MongoDB.

**Файлы:**
- `user.py` - модель пользователя (email, пароль, имя, аватар)
- `item.py` - модель товара (название, описание, цена, локация, статус)
- `rental.py` - модель бронирования (даты, статус, участники)
- `category.py` - модель категории товаров
- `message.py` - модель сообщения в чате
- `notification.py` - модель уведомления
- `availability_calendar.py` - модель календаря доступности товара

**Методы:** `to_dict()`, `from_dict()` для конвертации между Python объектами и MongoDB документами.

---

## Документация

### user.py

Модель пользователя системы.

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `email` (str) - email пользователя (уникальный)
- `password_hash` (str) - хеш пароля (bcrypt)
- `name` (str) - имя пользователя
- `avatar_url` (str, optional) - URL аватара
- `created_at` (datetime) - дата создания
- `updated_at` (datetime) - дата последнего обновления

**Коллекция:** `users`

### item.py

Модель товара для аренды.

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `owner_id` (ObjectId) - ID владельца товара
- `title` (str) - название товара
- `description` (str) - описание
- `category` (str) - категория товара
- `price_per_day` (float) - цена за день
- `price_per_week` (float, optional) - цена за неделю
- `price_per_month` (float, optional) - цена за месяц
- `location` (dict) - локация (address, lat, lng)
- `parameters` (dict) - дополнительные параметры (размеры, вес и т.д.)
- `images` (list[str]) - массив URL изображений
- `status` (str) - статус: `draft`, `active`, `inactive`, `archived`
- `created_at`, `updated_at` (datetime)

**Коллекция:** `items`

### rental.py

Модель бронирования (аренды).

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `item_id` (ObjectId) - ID товара
- `renter_id` (ObjectId) - ID арендатора
- `owner_id` (ObjectId) - ID владельца товара
- `start_date` (date) - дата начала аренды
- `end_date` (date) - дата окончания аренды
- `total_price` (float) - общая стоимость аренды
- `status` (str) - статус: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`
- `created_at`, `updated_at` (datetime)

**Коллекция:** `rentals`

**Логика статусов:**
- `pending` - заявка создана, ожидает подтверждения владельцем
- `confirmed` - владелец подтвердил заявку
- `in_progress` - аренда активна (можно установить вручную или автоматически по датам)
- `completed` - аренда завершена
- `cancelled` - заявка отменена

### category.py

Модель категории товаров.

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `name` (str) - название категории
- `slug` (str) - URL-дружественное имя (уникальное)
- `description` (str, optional) - описание категории
- `created_at`, `updated_at` (datetime)

**Коллекция:** `categories`

### message.py

Модель сообщения в чате между пользователями.

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `rental_id` (ObjectId) - ID бронирования, к которому относится сообщение
- `sender_id` (ObjectId) - ID отправителя
- `receiver_id` (ObjectId) - ID получателя
- `content` (str) - текст сообщения или URL изображения
- `message_type` (str) - тип: `text` или `image`
- `read_at` (datetime, optional) - дата прочтения
- `created_at` (datetime) - дата отправки

**Коллекция:** `messages`

### notification.py

Модель уведомления пользователя.

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `user_id` (ObjectId) - ID пользователя
- `notification_type` (str) - тип: `new_rental_request`, `new_message`, `rental_confirmed`, `rental_rejected`
- `title` (str) - заголовок уведомления
- `content` (str) - содержимое уведомления
- `read_at` (datetime, optional) - дата прочтения
- `created_at` (datetime) - дата создания

**Коллекция:** `notifications`

### availability_calendar.py

Модель календаря доступности товара.

**Поля:**
- `_id` (ObjectId) - уникальный идентификатор
- `item_id` (ObjectId) - ID товара
- `date` (date) - дата
- `available` (bool) - доступна ли дата
- `rental_id` (ObjectId, optional) - ID бронирования, если дата занята

**Коллекция:** `availability_calendar`

**Назначение:** Хранение информации о доступности товара по датам. Обновляется автоматически при создании/подтверждении бронирований.

