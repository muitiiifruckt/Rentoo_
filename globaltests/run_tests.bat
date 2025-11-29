@echo off
REM Скрипт для запуска E2E тестов (Windows)

echo Starting E2E tests...

REM Активируем виртуальное окружение
if exist "venv" (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Please run setup.bat first.
    exit /b 1
)

REM Проверяем, что зависимости установлены
if not exist "node_modules" (
    echo Node modules not found. Installing...
    call npm install
)

REM Запускаем тесты
echo Running Playwright tests...
call npm test

echo Tests completed!


