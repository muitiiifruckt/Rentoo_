@echo off
echo Starting tests...
timeout /t 1 /nobreak >nul
npm test -- --reporter=list > test-results.txt 2>&1
echo Tests completed. Check test-results.txt

