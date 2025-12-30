@echo off
setlocal enabledelayedexpansion
color 0A
chcp 65001 >nul
cls
echo.
echo  ========================================================
echo         MediSync SQLite - Baslat
echo  ========================================================
echo.

REM Node.js kontrolu
where node >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: Node.js kurulu degil!
    echo.
    echo  Lutfen https://nodejs.org adresinden Node.js yukleyin.
    pause
    exit /b 1
)
echo  [OK] Node.js bulundu
echo.

REM node_modules kontrolu
if not exist "node_modules" (
    color 0E
    echo  [!] Kurulum yapilmamis, KURULUM.bat calistiriliyor...
    call KURULUM.bat
    if !errorlevel! neq 0 exit /b 1
)
echo  [OK] Bagimliliklar hazir
echo.

REM Sunucuyu baslat
color 0A
echo  ========================================================
echo  > Tarayicinizda: http://localhost:3005
echo  > Durdurmak icin: CTRL + C
echo  ========================================================
echo.

call npm run dev -- -p 3005

echo.
echo  Sunucu durduruldu.
pause
endlocal
