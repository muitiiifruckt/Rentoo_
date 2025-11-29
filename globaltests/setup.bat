@echo off
REM Скрипт для настройки окружения тестов (Windows)

echo Setting up E2E test environment...

REM Создаем виртуальное окружение Python
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Активируем виртуальное окружение
call venv\Scripts\activate.bat

REM Устанавливаем Python зависимости
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Устанавливаем Node.js зависимости
echo Installing Node.js dependencies...
call npm install

REM Устанавливаем браузеры для Playwright
echo Installing Playwright browsers...
call npx playwright install chromium

echo Setup complete!
echo To activate the virtual environment, run: venv\Scripts\activate
echo To run tests, use: npm test



