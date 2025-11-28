# Скрипт для запуска тестов с сохранением результатов
$outputFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

Write-Host "Запуск тестов... Результаты будут сохранены в $outputFile" -ForegroundColor Green
Write-Host "Это может занять несколько минут..." -ForegroundColor Yellow

# Запускаем тесты и сохраняем вывод
npm test -- --reporter=list 2>&1 | Tee-Object -FilePath $outputFile

Write-Host "`nТесты завершены! Результаты сохранены в $outputFile" -ForegroundColor Green
Write-Host "Откройте файл для просмотра результатов." -ForegroundColor Cyan

