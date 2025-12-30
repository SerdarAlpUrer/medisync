@echo off
setlocal enabledelayedexpansion
title MediSync Baslatiliyor...
color 0B
chcp 65001 >nul
cls

echo.
echo  ========================================================
echo         MediSync Version 1 - Tek Tik Baslatma
echo  ========================================================
echo.

REM 1. Node.js Kontrolu
where node >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: Node.js kurulu degil!
    echo.
    echo  Lutfen https://nodejs.org adresinden Node.js yukleyin.
    echo.
    pause
    exit /b 1
)

REM 2. Kurulum Kontrolu (node_modules)
if not exist "node_modules" (
    color 0E
    echo  [!] Kurulum yapilmamis, otomatik kurulum baslatiliyor...
    echo.
    
    echo  [1/4] Bagimliliklar yukleniyor...
    call npm install --legacy-peer-deps
    if !errorlevel! neq 0 (
        echo  [X] Bagimlilik yukleme hatasi!
        pause
        exit /b 1
    )
    
    echo  [2/4] Veritabani istemcisi olusturuluyor...
    call npm run db:generate
    
    echo  [3/4] Veritabani esitleniyor...
    call npm run db:push
    if !errorlevel! neq 0 (
        echo  [X] Veritabani esitleme hatasi!
        echo  Lutfen .env dosyasini kontrol edin.
        pause
        exit /b 1
    )
    
    echo  [4/4] Ornek veriler yukleniyor...
    call npm run db:seed
    
    echo.
    echo  [OK] Kurulum tamamlandi!
    echo.
    color 0B
)

REM 3. Port ve Ag Bilgilerini Goruntule
set "APP_PORT=3000"
if exist ".env" (
    for /f "tokens=2 delims==" %%a in ('findstr "NEXT_PUBLIC_APP_PORT" .env') do set "APP_PORT=%%a"
)

echo  [INFO] Yerel Ag IP Adresleriniz (Port: %APP_PORT%):
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' } | ForEach-Object { echo \"  - http://$($_.IPAddress):%APP_PORT%\" }"
echo.
echo  [!] QR kodlarin calismasi icin .env dosyasindaki 
echo      NEXT_PUBLIC_APP_URL degerini yukaridaki IP'lerden 
echo      biriyle guncellemeniz onerilir.
echo.

REM 4. Uygulamayi Baslatma
echo  [OK] Sistem hazir, uygulama baslatiliyor...
echo.
echo  Tarayici 5 saniye icinde otomatik acilacak...
echo.

REM Arka planda 5 saniye bekleyip tarayiciyi acan komut
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:%APP_PORT%"

REM Sunucuyu baslat
call npx next dev -p %APP_PORT% --webpack

REM Eger sunucu kapanirsa burasi calisir
echo.
echo  Uygulama kapatildi.
pause
