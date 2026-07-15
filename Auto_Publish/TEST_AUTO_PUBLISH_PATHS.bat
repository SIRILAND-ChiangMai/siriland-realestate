@echo off
title SIRILAND Auto Publish Path Test
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
"$c=Get-Content '%~dp0auto-publish-config.json' -Raw | ConvertFrom-Json; ^
Write-Host ''; ^
Write-Host 'CMS:' $c.cmsFolder -ForegroundColor Cyan; Test-Path $c.cmsFolder; ^
Write-Host 'REPO:' $c.githubFolder -ForegroundColor Cyan; Test-Path $c.githubFolder; ^
Write-Host '.GIT:' (Join-Path $c.githubFolder '.git') -ForegroundColor Cyan; Test-Path (Join-Path $c.githubFolder '.git'); ^
Write-Host 'GIT COMMAND:' -ForegroundColor Cyan; Get-Command git -ErrorAction SilentlyContinue | Format-List Source; ^
Write-Host 'PORT 8787:' -ForegroundColor Cyan; netstat -aon | findstr ':8787'; ^
Write-Host ''; Read-Host 'Kapatmak icin ENTER'"
