@echo off
setlocal
color 0A
chcp 65001 >nul
cls

echo.
echo ========================================================
echo     MediSync - Yeni Müşteri & Hastane İlk Kurulum Sihirbazı
echo ========================================================
echo.
cd /d "%~dp0"

call npx tsx scripts/clean-hospital-setup.ts

echo.
pause
