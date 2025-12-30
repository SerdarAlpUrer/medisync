@echo off
setlocal enabledelayedexpansion
color 0B
chcp 65001 >nul
cls
echo.
echo  ========================================================
echo         MediSync SQLite - Kurulum
echo  ========================================================
echo.

REM Node.js kontrolu
echo  [1/4] Node.js kontrol ediliyor...
where node >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: Node.js kurulu degil!
    echo.
    echo  Lutfen https://nodejs.org adresinden Node.js yukleyin.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo  [OK] Node.js: %%i
echo.

REM Bagimliliklari yukle
echo  [2/4] Bagimliliklar yukleniyor...
call npm install --legacy-peer-deps
if !errorlevel! neq 0 (
    call npm install --force
    if !errorlevel! neq 0 (
        color 0C
        echo  [X] HATA: Bagimliliklar yuklenemedi!
        pause
        exit /b 1
    )
)
echo  [OK] Bagimliliklar yuklendi
echo.

REM Prisma generate
echo  [3/4] Veritabani istemcisi olusturuluyor...
call npx prisma generate
echo  [OK] Prisma Client hazir
echo.

REM Veritabani olustur
echo  [4/4] SQLite veritabani olusturuluyor...
call npx prisma db push
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: Veritabani olusturulamadi!
    pause
    exit /b 1
)
echo  [OK] Veritabani hazir
echo.

REM Admin kullanici olustur
echo  [BONUS] Admin kullanicisi olusturuluyor...
call npx tsx scripts/seed-admin.ts
echo.

color 0A
echo  ========================================================
echo              KURULUM TAMAMLANDI!
echo  ========================================================
echo.
echo  Simdi BASLAT.bat dosyasini calistirarak
echo  uygulamayi baslatabilirsiniz.
echo.
echo  Giris bilgileri: admin@medisync.local / admin123
echo.
pause
endlocal
