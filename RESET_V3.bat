@echo off
if exist "%~dp0publish-config.json" del "%~dp0publish-config.json"
if exist "%~dp0publish-history.json" del "%~dp0publish-history.json"
echo Ayarlar ve publish history sifirlandi.
pause
