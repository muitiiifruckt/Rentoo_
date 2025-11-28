@echo off
echo ========================================
echo Запуск E2E тестов
echo ========================================
echo.
echo Убедитесь, что backend и frontend запущены!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
echo.
echo Запуск тестов...
echo.

npm test

echo.
echo ========================================
echo Тесты завершены!
echo ========================================
pause

