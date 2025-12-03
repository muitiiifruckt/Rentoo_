# Docker Setup для Rentoo

Этот документ описывает, как запустить приложение Rentoo с помощью Docker и Docker Compose.

## Требования

- Docker (версия 20.10 или выше)
- Docker Compose (версия 2.0 или выше)

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd Rentoo_
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта (опционально, для production):

```env
SECRET_KEY=your-secret-key-here
MONGODB_URL=mongodb://mongodb:27017
MONGODB_DB_NAME=rentoo
DEBUG=false
CORS_ORIGINS=http://localhost:3000,http://localhost
VITE_API_URL=http://localhost:8000
```

### 3. Запуск приложения

#### Development режим:

```bash
docker-compose up -d
```

#### Production режим:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Проверка работы

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MongoDB: localhost:27017

## Структура Docker файлов

```
Rentoo_/
├── docker-compose.yml          # Development конфигурация
├── docker-compose.prod.yml     # Production конфигурация
├── backend/
│   ├── Dockerfile              # Backend образ
│   └── .dockerignore           # Исключения для backend
├── frontend/
│   ├── Dockerfile              # Frontend образ (multi-stage)
│   ├── nginx.conf              # Nginx конфигурация
│   └── .dockerignore           # Исключения для frontend
└── .dockerignore               # Общие исключения
```

## Сервисы

### MongoDB
- Порт: 27017
- Данные сохраняются в volume `mongodb_data`
- Healthcheck проверяет доступность

### Backend (FastAPI)
- Порт: 8000
- Автоматически подключается к MongoDB
- Загруженные файлы сохраняются в `backend/uploads`
- Healthcheck: `/health` endpoint

### Frontend (React + Nginx)
- Порт: 3000 (80 внутри контейнера)
- Production build React приложения
- Nginx для статики и проксирования API запросов
- SPA routing настроен

## Полезные команды

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Остановка

```bash
docker-compose down
```

### Остановка с удалением volumes

```bash
docker-compose down -v
```

### Пересборка образов

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Выполнение команд в контейнере

```bash
# Backend
docker-compose exec backend bash
docker-compose exec backend python -m pytest

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh
```

### Просмотр статуса

```bash
docker-compose ps
```

## Переменные окружения

### Backend

- `MONGODB_URL` - URL подключения к MongoDB (по умолчанию: `mongodb://mongodb:27017`)
- `MONGODB_DB_NAME` - Имя базы данных (по умолчанию: `rentoo`)
- `SECRET_KEY` - Секретный ключ для JWT (обязательно изменить в production!)
- `DEBUG` - Режим отладки (по умолчанию: `false`)
- `CORS_ORIGINS` - Разрешенные источники для CORS

### Frontend

- `VITE_API_URL` - URL backend API (по умолчанию: `http://localhost:8000`)

## Volumes

- `mongodb_data` - Данные MongoDB
- `./backend/uploads` - Загруженные файлы (images)

## Troubleshooting

### Проблема: Backend не может подключиться к MongoDB

**Решение:** Убедитесь, что MongoDB запущен и здоров:
```bash
docker-compose ps
docker-compose logs mongodb
```

### Проблема: Frontend не может подключиться к Backend

**Решение:** Проверьте, что `VITE_API_URL` правильно настроен и backend доступен:
```bash
curl http://localhost:8000/health
```

### Проблема: Изображения не загружаются

**Решение:** Проверьте права доступа к папке uploads:
```bash
docker-compose exec backend ls -la uploads/
```

### Проблема: Порт уже занят

**Решение:** Измените порты в `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Вместо 8000:8000
```

## Production Deployment

Для production используйте `docker-compose.prod.yml`:

1. Установите все необходимые переменные окружения
2. Используйте сильные секретные ключи
3. Настройте правильные CORS origins
4. Используйте reverse proxy (nginx/traefik) для HTTPS
5. Настройте резервное копирование MongoDB

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Обновление приложения

```bash
# Остановить контейнеры
docker-compose down

# Обновить код
git pull

# Пересобрать и запустить
docker-compose build --no-cache
docker-compose up -d
```

