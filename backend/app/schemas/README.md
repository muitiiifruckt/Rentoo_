# schemas

Pydantic схемы для валидации данных.

**Назначение:** Валидация входных данных API и сериализация ответов.

**Файлы:**
- `user.py` - схемы пользователя (создание, обновление, ответ)
- `item.py` - схемы товара (создание, обновление, поиск, ответ)
- `rental.py` - схемы бронирования (создание, обновление, подтверждение, ответ)
- `category.py` - схемы категории
- `message.py` - схемы сообщения
- `notification.py` - схемы уведомления

**Типы схем:**
- `*Base` - базовая схема
- `*Create` - для создания
- `*Update` - для обновления
- `*Response` - для ответа API

---

## Документация

### user.py

**UserBase:**
- `email` (EmailStr) - валидированный email
- `name` (str, 1-100 символов) - имя пользователя

**UserCreate (наследует UserBase):**
- `password` (str, минимум 6 символов) - пароль

**UserUpdate:**
- `name` (str, optional) - новое имя
- `avatar_url` (str, optional) - новый URL аватара

**UserResponse (наследует UserBase):**
- `id` (str) - ID пользователя (ObjectId как строка)
- `avatar_url` (str, optional)
- `created_at`, `updated_at` (datetime)

**UserLogin:**
- `email` (EmailStr)
- `password` (str)

### item.py

**ItemBase:**
- `title` (str, 1-200 символов)
- `description` (str, минимум 1 символ)
- `category` (str)
- `price_per_day` (float, > 0)
- `price_per_week` (float, optional, > 0)
- `price_per_month` (float, optional, > 0)
- `location` (dict, optional) - локация
- `parameters` (dict, optional) - дополнительные параметры

**ItemCreate (наследует ItemBase):**
- `images` (list[str], optional) - массив URL изображений

**ItemUpdate:**
- Все поля опциональны (частичное обновление)
- `status` (str, optional) - новый статус

**ItemResponse (наследует ItemBase):**
- `id` (str) - ID товара
- `owner_id` (str) - ID владельца
- `images` (list[str]) - массив изображений
- `status` (str)
- `created_at`, `updated_at` (datetime)

**ItemSearch:**
- `query` (str, optional) - текстовый поиск
- `category` (str, optional) - фильтр по категории
- `min_price`, `max_price` (float, optional) - фильтр по цене
- `location` (str, optional) - фильтр по локации
- `page` (int, default=1, >= 1) - номер страницы
- `limit` (int, default=20, 1-100) - количество результатов
- `sort_by` (str, default="created_at") - поле сортировки
- `sort_order` (str, default="desc") - порядок: "asc" или "desc"

### rental.py

**RentalBase:**
- `item_id` (str) - ID товара
- `start_date` (date) - дата начала
- `end_date` (date) - дата окончания

**RentalCreate (наследует RentalBase):**
- Используется для создания заявки на бронирование

**RentalUpdate:**
- `status` (str, optional) - новый статус

**RentalResponse (наследует RentalBase):**
- `id` (str) - ID бронирования
- `renter_id` (str) - ID арендатора
- `owner_id` (str) - ID владельца
- `total_price` (float) - общая стоимость
- `status` (str)
- `created_at`, `updated_at` (datetime)

**RentalConfirm:**
- `confirm` (bool, default=True) - подтвердить или отклонить заявку

### category.py

**CategoryBase:**
- `name` (str, 1-100 символов)
- `slug` (str, 1-100 символов) - URL-дружественное имя
- `description` (str, optional)

**CategoryCreate (наследует CategoryBase):**
- Используется для создания категории

**CategoryResponse (наследует CategoryBase):**
- `id` (str) - ID категории
- `created_at`, `updated_at` (datetime)

### message.py

**MessageBase:**
- `content` (str, минимум 1 символ) - текст или URL изображения
- `message_type` (str, default="text") - "text" или "image"

**MessageCreate (наследует MessageBase):**
- `rental_id` (str) - ID бронирования
- `receiver_id` (str) - ID получателя

**MessageResponse (наследует MessageBase):**
- `id` (str) - ID сообщения
- `rental_id` (str)
- `sender_id` (str) - ID отправителя
- `receiver_id` (str)
- `read_at` (datetime, optional)
- `created_at` (datetime)

### notification.py

**NotificationBase:**
- `notification_type` (str) - тип уведомления
- `title` (str, 1-200 символов)
- `content` (str, минимум 1 символ)

**NotificationResponse (наследует NotificationBase):**
- `id` (str) - ID уведомления
- `user_id` (str) - ID пользователя
- `read_at` (datetime, optional)
- `created_at` (datetime)

