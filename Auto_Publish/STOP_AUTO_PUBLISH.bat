@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8787" ^| findstr "LISTENING"') do taskkill /PID %%a /F
echo Auto Publish servisi durduruldu.
pause
