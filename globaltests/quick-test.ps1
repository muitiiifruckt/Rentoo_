# Быстрый запуск тестов с ограниченным выводом
Write-Host "Запуск тестов (первые 100 строк вывода)..." -ForegroundColor Green

npm test -- --reporter=line 2>&1 | Select-Object -First 100

Write-Host "`nДля полного вывода запустите: npm test" -ForegroundColor Yellow

