@echo off
REM Запуск тестов без зависаний - вывод в файл
echo Запуск тестов...
echo Результаты будут сохранены в test-results.txt
echo Это может занять 2-3 минуты...
echo.

npm test -- --reporter=list > test-results.txt 2>&1

echo.
echo ========================================
echo Тесты завершены!
echo ========================================
echo.
echo Последние 50 строк результатов:
echo.
powershell -Command "Get-Content test-results.txt -Tail 50"
echo.
echo Полные результаты в файле: test-results.txt
pause

