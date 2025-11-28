# Скрипт для запуска тестов и автоматического исправления
Write-Host "Запуск тестов..." -ForegroundColor Green

# Запускаем тесты и сохраняем вывод
$output = npm test -- --reporter=list --workers=1 2>&1 | Out-String

# Сохраняем в файл
$output | Out-File -FilePath "test-results-full.txt" -Encoding UTF8

# Анализируем результаты
Write-Host "`n=== АНАЛИЗ РЕЗУЛЬТАТОВ ===" -ForegroundColor Cyan

$failedTests = $output | Select-String -Pattern "failed|Error:" -Context 2,5
$passedCount = ($output | Select-String -Pattern "passed").Count
$failedCount = ($output | Select-String -Pattern "failed").Count

Write-Host "Пройдено: $passedCount" -ForegroundColor Green
Write-Host "Провалено: $failedCount" -ForegroundColor $(if($failedCount -gt 0){'Red'}else{'Green'})

if ($failedTests) {
    Write-Host "`nПРОВАЛИВШИЕСЯ ТЕСТЫ:" -ForegroundColor Red
    $failedTests | Select-Object -First 50
}

Write-Host "`nПолные результаты сохранены в test-results-full.txt" -ForegroundColor Yellow

