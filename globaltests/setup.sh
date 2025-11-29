#!/bin/bash
# Скрипт для настройки окружения тестов

echo "Setting up E2E test environment..."

# Создаем виртуальное окружение Python
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
source venv/bin/activate

# Устанавливаем Python зависимости
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Устанавливаем Node.js зависимости
echo "Installing Node.js dependencies..."
npm install

# Устанавливаем браузеры для Playwright
echo "Installing Playwright browsers..."
npx playwright install chromium

echo "Setup complete!"
echo "To activate the virtual environment, run: source venv/bin/activate"
echo "To run tests, use: npm test"



