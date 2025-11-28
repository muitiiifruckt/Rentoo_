#!/bin/bash
# Скрипт для запуска E2E тестов

echo "Starting E2E tests..."

# Активируем виртуальное окружение
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Проверяем, что зависимости установлены
if [ ! -d "node_modules" ]; then
    echo "Node modules not found. Installing..."
    npm install
fi

# Запускаем тесты
echo "Running Playwright tests..."
npm test

echo "Tests completed!"

