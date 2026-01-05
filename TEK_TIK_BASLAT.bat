@echo off
setlocal enabledelayedexpansion
title MediSync (SQLite) Baslatiliyor...
color 0A

:: Port ayari (BASLAT.bat ile ayni olmali -> 3005)
set "PORT=3005"

echo.
echo  ========================================================
echo         MediSync (SQLite) - Tek Tik Baslat
echo  ========================================================
echo.

:: 1. Adim: Port 3005 uzerinde calisan uygulama varsa kapat
echo  [1/3] Acik port kontrol ediliyor (%PORT%)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    echo        - PID %%a bulundu. Sonlandiriliyor...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo        - Eski oturum basariyla kapatildi.
    ) else (
        echo        - Hata: Eski oturum kapatilamadi veya zaten kapali.
    )
)
echo  [OK] Port temizlendi.

:: 1.5. Adim: Veritabani hazirliklari
echo.
echo  [1.5/3] Veritabani kontrol ediliyor...
echo        - Prisma Client olusturuluyor...
call npx prisma generate
echo        - Veritabani semasi esitleniyor...
call npx prisma db push
echo  [OK] Veritabani hazir.

:: 2. Adim: Tarayiciyi zamanla (Arka planda)
echo.
echo  [2/3] Tarayici acilisi zamanlaniyor (15 sn)...
:: Sunucu acilana kadar bekleyip oyle acacak
start "" /MIN cmd /c "timeout /t 15 >nul && start "" http://localhost:%PORT%"

:: 3. Adim: Uygulamayi baslat
echo.
echo  [3/3] Sunucu baslatiliyor...
echo.
echo  ========================================================
echo  > LUTFEN BEKLEYIN - Uygulama hazirlaniyor...
echo  > (Tarayici 15 saniye icinde otomatik acilacaktir)
echo  >
echo  > Uygulama adresi: http://localhost:%PORT%
echo  > Kapatmak icin: CTRL+C
echo  ========================================================
echo.

:: npm run dev komutunu calistir
call npm run dev -- -p %PORT%

pause
