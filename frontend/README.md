# Rentoo Frontend

Минималистичный, современный UI для сервиса аренды вещей на React + Tailwind CSS.

## Технологический стек

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - стилизация
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **Lucide React** - иконки
- **Vitest** + **React Testing Library** - тестирование

## Структура проекта

```
frontend/
├── src/
│   ├── components/          # Переиспользуемые компоненты
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Header.tsx
│   │   ├── ItemCard.tsx
│   │   ├── Grid.tsx
│   │   ├── Form.tsx
│   │   └── __tests__/       # Тесты компонентов
│   ├── pages/               # Страницы приложения
│   │   ├── Home.tsx
│   │   ├── ItemDetail.tsx
│   │   ├── AddItem.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Rentals.tsx
│   ├── contexts/            # React контексты
│   │   └── AuthContext.tsx
│   ├── lib/                 # Утилиты и API клиент
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── App.tsx              # Главный компонент
│   ├── main.tsx             # Точка входа
│   └── index.css            # Глобальные стили
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Установка и запуск

### Требования

- Node.js 18+ и npm/yarn/pnpm
- Запущенный бэкенд на `http://localhost:8000` (см. `../backend/README.md`)

### Установка зависимостей

```bash
cd frontend
npm install
```

**Важно:** Убедитесь, что бэкенд запущен перед запуском фронтенда, так как фронтенд будет делать запросы к API.

### Разработка

Запуск dev-сервера:

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Сборка для production

```bash
npm run build
```

Собранные файлы будут в папке `dist/`

### Предпросмотр production сборки

```bash
npm run preview
```

## Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

По умолчанию используется `http://localhost:8000` (настроено в `vite.config.ts` через proxy).

## Компоненты

### Button

Кнопка с несколькими вариантами стилей.

```tsx
<Button variant="primary" loading={false}>
  Нажми меня
</Button>
```

Варианты: `primary`, `ghost`, `outline`, `danger`

### Modal

Модальное окно с focus trap и поддержкой клавиатуры.

```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Заголовок">
  Содержимое модального окна
</Modal>
```

### ItemCard

Карточка товара для отображения в списке.

```tsx
<ItemCard
  item={item}
  onRent={(item) => handleRent(item)}
  onClick={(item) => navigate(`/items/${item.id}`)}
/>
```

### Grid

Адаптивная сетка для карточек.

```tsx
<Grid loading={loading} emptyMessage="Ничего не найдено">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</Grid>
```

### Form

Универсальная форма с валидацией.

```tsx
<Form
  fields={fields}
  onSubmit={handleSubmit}
  submitLabel="Сохранить"
  loading={loading}
/>
```

## API интеграция

Все API вызовы находятся в `src/lib/api.ts`. API клиент автоматически:

- Добавляет JWT токен из localStorage в заголовки
- Обрабатывает ошибки 401 (перенаправляет на /login)
- Использует proxy для разработки (настроено в vite.config.ts)

## Тестирование

Запуск тестов:

```bash
npm test
```

Запуск тестов с UI:

```bash
npm run test:ui
```

## Дизайн-система

### Цвета

- `background`: #F7F8FA
- `surface`: #FFFFFF
- `primary`: #2563EB
- `accent`: #06B6D4
- `text.primary`: #0F172A
- `text.secondary`: #475569
- `error`: #EF4444
- `success`: #10B981

### Типографика

- Шрифт: Inter
- Размеры: h1 (28-32px), h2 (22-26px), h3 (18-20px), body (16px), small (14px)

### Отступы

Базовая единица: 8px (8, 16, 24, 32...)

### Радиусы

- `small`: 8px
- `medium`: 12px

## Доступность (Accessibility)

- Все интерактивные элементы имеют видимый focus ring
- Формы имеют связанные labels и сообщения об ошибках
- Модальные окна используют focus trap
- Поддержка навигации с клавиатуры
- ARIA атрибуты для кастомных компонентов

## Производительность

- Lazy loading изображений
- Мемоизация тяжелых компонентов (где необходимо)
- Оптимизация перерисовок через React hooks

## Лицензия

MIT

