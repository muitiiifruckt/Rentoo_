# Rentoo E2E Tests

End-to-end тесты для Rentoo с использованием Playwright.

## Установка

### 1. Установка зависимостей Python

```bash
# Создать виртуальное окружение
python -m venv venv

# Активировать (Windows)
venv\Scripts\activate

# Активировать (Linux/Mac)
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
```

### 2. Установка зависимостей Node.js

```bash
npm install
```

### 3. Установка браузеров для Playwright

```bash
npm run install:browsers
```

## Запуск тестов

### Первоначальная настройка

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Все тесты

```bash
npm test
```

Или используйте скрипты:
- Windows: `run_tests.bat`
- Linux/Mac: `./run_tests.sh`

### С UI режимом

```bash
npm run test:ui
```

### В видимом режиме (headed)

```bash
npm run test:headed
```

### Отладка

```bash
npm run test:debug
```

### Просмотр отчета

```bash
npm run test:report
```

## Важные замечания

1. **MongoDB должна быть запущена** перед запуском тестов
2. Тесты автоматически запускают backend и frontend серверы
3. Используется тестовая база данных (настраивается через переменные окружения backend)
4. Все тесты изолированы и используют уникальные email адреса

## Структура тестов

```
globaltests/
├── tests/
│   ├── auth.spec.ts          # Тесты аутентификации
│   ├── items.spec.ts         # Тесты управления товарами
│   ├── search.spec.ts        # Тесты поиска
│   ├── rentals.spec.ts       # Тесты бронирований
│   ├── profile.spec.ts       # Тесты профиля
│   └── fixtures.ts           # Утилиты и фикстуры
├── playwright.config.ts      # Конфигурация Playwright
├── requirements.txt          # Python зависимости
└── package.json              # Node.js зависимости
```

## Требования

- Python 3.8+
- Node.js 18+
- MongoDB (должна быть запущена)
- Backend и Frontend серверы (запускаются автоматически через webServer в playwright.config.ts)

## Примечания

- Тесты автоматически запускают backend и frontend серверы перед выполнением
- Используется отдельная тестовая база данных (настраивается через переменные окружения)
- Все тесты изолированы и могут выполняться параллельно

