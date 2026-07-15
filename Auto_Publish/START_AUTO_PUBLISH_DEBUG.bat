@echo off
title SIRILAND Auto Publish PRO - DEBUG
echo.
echo SIRILAND AUTO PUBLISH DEBUG
echo ===========================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
"try { & '%~dp0auto-publish-server.ps1' } catch { ^
$log = @('SIRILAND AUTO PUBLISH ERROR', '============================', ('Date: ' + (Get-Date)), ('Error: ' + $_.Exception.Message), '', $_.ScriptStackTrace); ^
$log | Set-Content -Path '%~dp0AUTO_PUBLISH_ERROR.txt' -Encoding UTF8; ^
Write-Host ''; Write-Host 'AUTO PUBLISH BASLATILAMADI' -ForegroundColor Red; ^
Write-Host $_.Exception.Message -ForegroundColor Yellow; ^
Write-Host ''; Write-Host 'Hata dosyasi:' -ForegroundColor Cyan; ^
Write-Host '%~dp0AUTO_PUBLISH_ERROR.txt'; ^
Read-Host 'Kapatmak icin ENTER' }"
echo.
pause
