@echo off
chcp 65001 > nul
echo ========================================================
echo   MediSync TEST Sunucusu Baslatiliyor...
echo   Portlar: HTTP 3100 / HTTPS 3543
echo   Veritabani: medisync_test
echo ========================================================
cd /d "C:\medisync-test"
start "MediSync-Test-Server" /min node server.js
echo.
echo Test sunucusu arka planda baslatildi.
echo Erisim URL'leri:
echo   - HTTP:  http://188.132.215.147:3100
echo   - HTTPS: https://188.132.215.147:3543
echo.
pause
