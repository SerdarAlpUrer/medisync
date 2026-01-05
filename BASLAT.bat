@echo off
color 0A
chcp 65001 >nul
cls

echo.
echo  ========================================================
echo         MediSync SQLite - Baslat
echo  ========================================================
echo.

REM Scriptin calistigi dizine gec
cd /d "%~dp0"

REM Node.js kontrolu
where node >nul 2>&1
if %errorlevel% neq 0 goto NODE_MISSING

echo  [OK] Calisma dizini ayarlandi.
echo.

REM node_modules kontrolu
if not exist "node_modules" goto INSTALL

goto START_SERVER

:INSTALL
color 0E
echo  [!] Kurulum yapilmamis, KURULUM.bat calistiriliyor...
call KURULUM.bat
if %errorlevel% neq 0 goto ERROR_EXIT
goto START_SERVER

:NODE_MISSING
color 0C
echo  [X] HATA: Node.js kurulu degil!
echo.
echo  Lutfen https://nodejs.org adresinden Node.js yukleyin.
pause
exit /b 1

:START_SERVER
echo  [OK] Bagimliliklar hazir.
echo.

REM Port 3005 temizle
echo  [*] Port 3005 kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING 2^>nul') do taskkill /F /PID %%a >nul 2>&1

echo  [OK] Port hazir.
echo.
echo  ========================================================
echo  ^> Tarayicinizda: http://localhost:3005
echo  ^> Durdurmak icin: CTRL + C
echo  ========================================================
echo.

cmd /c "npm run dev -- -p 3005"

echo.
echo  Sunucu durduruldu.
pause
exit /b

:ERROR_EXIT
echo.
echo [X] Bir hata olustu.
pause
exit /b 1
