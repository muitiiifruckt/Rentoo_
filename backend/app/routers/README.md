# routers

API роутеры (endpoints).

**Назначение:** HTTP endpoints для клиентских запросов.

**Файлы:**
- `auth.py` - аутентификация (регистрация, вход, текущий пользователь)
- `users.py` - управление пользователями (профиль, обновление)
- `items.py` - управление товарами (CRUD, поиск, загрузка изображений)
- `rentals.py` - управление бронированиями (создание, подтверждение, завершение)
- `messages.py` - чат (отправка, получение, отметка прочитанным)
- `notifications.py` - уведомления (список, отметка прочитанным)
- `categories.py` - категории (список)

**Префиксы:** Все роутеры используют префикс `/api/*`.

---

## Документация

### auth.py

**Префикс:** `/api/auth`

**Endpoints:**

- `POST /api/auth/register` - Регистрация нового пользователя
  - Тело: `UserCreate` (email, password, name)
  - Ответ: `UserResponse` (201 Created)
  - Ошибки: 400 если email уже зарегистрирован

- `POST /api/auth/login` - Вход в систему
  - Тело: `UserLogin` (email, password)
  - Ответ: `{access_token, refresh_token, token_type, user}`
  - Ошибки: 401 при неверных credentials

- `GET /api/auth/me` - Получение текущего пользователя
  - Требует: Bearer token
  - Ответ: `UserResponse`
  - Ошибки: 401 если не аутентифицирован

### users.py

**Префикс:** `/api/users`

**Endpoints:**

- `GET /api/users/{user_id}` - Получение профиля пользователя
  - Параметры: `user_id` (str)
  - Ответ: `UserResponse`
  - Ошибки: 404 если пользователь не найден

- `PUT /api/users/{user_id}` - Обновление профиля
  - Требует: Bearer token (только свой профиль)
  - Тело: `UserUpdate` (name, avatar_url)
  - Ответ: `UserResponse`
  - Ошибки: 403 если не свой профиль, 404 если не найден

### items.py

**Префикс:** `/api/items`

**Endpoints:**

- `POST /api/items` - Создание объявления о товаре
  - Требует: Bearer token
  - Тело: `ItemCreate`
  - Ответ: `ItemResponse` (201 Created)

- `GET /api/items` - Поиск товаров
  - Query параметры: `ItemSearch` (query, category, min_price, max_price, location, page, limit, sort_by, sort_order)
  - Ответ: `List[ItemResponse]`
  - Возвращает только товары со статусом `active`

- `GET /api/items/my` - Получение своих товаров
  - Требует: Bearer token
  - Ответ: `List[ItemResponse]`

- `GET /api/items/{item_id}` - Получение товара по ID
  - Параметры: `item_id` (str)
  - Ответ: `ItemResponse`
  - Ошибки: 404 если не найден

- `PUT /api/items/{item_id}` - Обновление товара
  - Требует: Bearer token (только владелец)
  - Тело: `ItemUpdate`
  - Ответ: `ItemResponse`
  - Ошибки: 403 если не владелец, 404 если не найден

- `DELETE /api/items/{item_id}` - Удаление товара
  - Требует: Bearer token (только владелец)
  - Ответ: 204 No Content
  - Ошибки: 403 если не владелец, 404 если не найден

- `POST /api/items/{item_id}/images` - Загрузка изображения для товара
  - Требует: Bearer token (только владелец)
  - Тело: multipart/form-data с файлом
  - Ответ: `ItemResponse` с обновленным списком изображений
  - Ошибки: 400 при неверном типе/размере файла

### rentals.py

**Префикс:** `/api/rentals`

**Endpoints:**

- `POST /api/rentals` - Создание заявки на бронирование
  - Требует: Bearer token
  - Тело: `RentalCreate` (item_id, start_date, end_date)
  - Ответ: `RentalResponse` (201 Created)
  - Автоматически: создает уведомление владельцу
  - Ошибки: 400 если даты неверны, товар недоступен, попытка арендовать свой товар

- `GET /api/rentals` - Получение списка бронирований
  - Требует: Bearer token
  - Query параметры: `role` (all/renter/owner)
  - Ответ: `List[RentalResponse]`

- `GET /api/rentals/{rental_id}` - Получение бронирования по ID
  - Требует: Bearer token (участник бронирования)
  - Ответ: `RentalResponse`
  - Ошибки: 403 если не участник, 404 если не найдено

- `PUT /api/rentals/{rental_id}/confirm` - Подтверждение/отклонение заявки
  - Требует: Bearer token (только владелец товара)
  - Тело: `RentalConfirm` (confirm: bool)
  - Ответ: `RentalResponse`
  - Автоматически: обновляет календарь доступности, создает уведомление арендатору
  - Ошибки: 403 если не владелец, 400 если статус не pending

- `PUT /api/rentals/{rental_id}/complete` - Завершение аренды
  - Требует: Bearer token (участник бронирования)
  - Ответ: `RentalResponse`
  - Ошибки: 400 если статус не позволяет завершить

### messages.py

**Префикс:** `/api/messages`

**Endpoints:**

- `POST /api/messages` - Отправка сообщения
  - Требует: Bearer token
  - Тело: `MessageCreate` (rental_id, receiver_id, content, message_type)
  - Ответ: `MessageResponse` (201 Created)
  - Автоматически: создает уведомление получателю
  - Ошибки: 403 если не участник бронирования, 400 если неверный получатель

- `GET /api/messages/rental/{rental_id}` - Получение истории сообщений
  - Требует: Bearer token (участник бронирования)
  - Ответ: `List[MessageResponse]`
  - Ошибки: 403 если не участник, 404 если бронирование не найдено

- `PUT /api/messages/{message_id}/read` - Отметка сообщения прочитанным
  - Требует: Bearer token (получатель сообщения)
  - Ответ: 204 No Content
  - Ошибки: 404 если сообщение не найдено или не получатель

### notifications.py

**Префикс:** `/api/notifications`

**Endpoints:**

- `GET /api/notifications` - Получение списка уведомлений
  - Требует: Bearer token
  - Query параметры: `unread_only` (bool, default=False)
  - Ответ: `List[NotificationResponse]`
  - Сортировка: по дате создания (новые сначала)

- `PUT /api/notifications/{notification_id}/read` - Отметка уведомления прочитанным
  - Требует: Bearer token (владелец уведомления)
  - Ответ: 204 No Content
  - Ошибки: 404 если не найдено или не владелец

### categories.py

**Префикс:** `/api/categories`

**Endpoints:**

- `GET /api/categories` - Получение списка всех категорий
  - Ответ: `List[CategoryResponse]`
  - Публичный endpoint (не требует аутентификации)

