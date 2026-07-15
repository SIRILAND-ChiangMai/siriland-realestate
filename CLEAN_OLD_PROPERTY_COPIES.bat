@echo off
setlocal EnableExtensions EnableDelayedExpansion
title SIRILAND CMS v5.1 - Duplicate Property File Cleanup
set "ROOT=%~dp0"
set "ARCHIVE=%ROOT%_OLD_PROPERTY_FILES_%RANDOM%"
mkdir "%ARCHIVE%" >nul 2>&1
echo.
echo Canonical files remain:
echo   properties.json
echo   properties.js
echo   data\properties.json
echo.
echo Duplicate copies are MOVED, never deleted.
echo.
for %%F in ("%ROOT%properties (*).json" "%ROOT%properties(*).json" "%ROOT%properties (*).js" "%ROOT%properties(*).js" "%ROOT%properties.js(*).js") do (
  if exist "%%~fF" (
    if /I not "%%~nxF"=="properties.json" if /I not "%%~nxF"=="properties.js" (
      echo Moving: %%~nxF
      move /Y "%%~fF" "%ARCHIVE%\" >nul
    )
  )
)
echo.
echo Archive folder:
echo %ARCHIVE%
echo.
pause
