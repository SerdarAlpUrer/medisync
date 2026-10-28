@echo off
title MediSync - Baslatiliyor...
cd /d "%~dp0"

echo ============================================
echo    MediSync Tibbi Cihaz Yonetim Sistemi
echo ============================================
echo.

:: 1. Set paths for embedded runtimes
:: We search for node.exe in runtime\nodejs.
if exist "%~dp0runtime\nodejs\node.exe" (
    set "NODE_HOME=%~dp0runtime\nodejs"
    set "PATH=%~dp0runtime\nodejs;%PATH%"
) else (
    echo [UYARI] Gömülü Node.js bulunamadi, sistemdeki versiyon denenecek.
)

if exist "%~dp0runtime\pgsql\bin\pg_ctl.exe" (
    set "PGSQL_HOME=%~dp0runtime\pgsql"
    set "PATH=%~dp0runtime\pgsql\bin;%PATH%"
) else (
    echo [UYARI] Gömülü PostgreSQL bulunamadi.
)

:: 2. PostgreSQL Control
echo [1/3] Veritabani servisi kontrol ediliyor...
tasklist /FI "IMAGENAME eq postgres.exe" 2>NUL | find /I /N "postgres.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Veritabani baslatiliyor...
    if exist "%~dp0data\pgsql" (
        start /B "" pg_ctl start -D "%~dp0data\pgsql" -l "%~dp0logs\postgresql.log"
        timeout /t 5 /nobreak > nul
    ) else (
        echo [HATA] Veritabani verisi bulunamadi! Lutfen once 'init-database.bat' calistirin.
        pause
        exit /b 1
    )
) else (
    echo Veritabani zaten calisiyor.
)

:: 3. Build Check (Automated)
if not exist ".next" (
    echo [2/3] İlk calistirma icin derleme yapiliyor (Bu islem birkac dakika surebilir)...
    call npm run build
) else (
    echo [2/3] Uygulama hazir.
)

:: 4. Start Application
echo [3/3] MediSync baslatiliyor...
echo.
echo ============================================
echo    Erisim Adresi: http://localhost:3000
echo    Durdurmak icin bu pencereyi kapatin.
echo ============================================
echo.

call npm start

pause
