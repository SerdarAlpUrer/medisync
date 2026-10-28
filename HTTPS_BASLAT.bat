@echo off
title MediSync (HTTPS & Kamera) - Sunucu
color 0A
chcp 65001 >nul
cls

echo.
echo ========================================================
echo        MediSync - Guvenli HTTPS Sunucusu Baslat
echo ========================================================
echo.

cd /d "%~dp0"

echo [*] Port 3000 ve 3443 kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3443 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1

echo.
echo ========================================================
echo   MediSync Servis Adresleri:
echo   HTTP Erisimi     : http://localhost:3000
echo   Guvenli HTTPS    : https://localhost:3443
echo   Mobil / Kamera   : https://188.132.215.147:3443
echo ========================================================
echo.
echo [INFO] Sunucu baslatiliyor...

node server.js
pause
