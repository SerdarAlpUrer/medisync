@echo off
setlocal enabledelayedexpansion
color 0B
chcp 65001 >nul
cls
echo.
echo  ========================================================
echo         MediSync Version 1 - Kurulum
echo  ========================================================
echo.

REM Node.js kontrolu
echo  [1/6] Node.js kontrol ediliyor...
where node >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: Node.js kurulu degil!
    echo.
    echo  Lutfen su adimlari takip edin:
    echo  1. https://nodejs.org adresine gidin
    echo  2. Yesil "LTS" butonuna tiklayin
    echo  3. Indirilen dosyayi calistirin
    echo  4. Bilgisayari yeniden baslatin
    echo  5. Bu dosyayi tekrar calistirin
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
echo  [OK] Node.js kurulu: !NODE_VERSION!
echo.

REM NPM kontrolu
echo  [2/6] NPM kontrol ediliyor...
where npm >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: NPM bulunamadi!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
echo  [OK] NPM hazir: !NPM_VERSION!
echo.

REM NPM cache temizleme (opsiyonel)
echo  [3/6] NPM cache temizleniyor...
call npm cache clean --force >nul 2>&1
echo  [OK] Cache temizlendi
echo.

REM Bagimliliklari yukle
echo  [4/6] Bagimliliklari yukleniyor (ilk seferde 2-3 dk surebilir)...
echo  Lutfen bekleyin, bu islem biraz zaman alabilir...
echo.
call npm install --legacy-peer-deps
set INSTALL_ERROR=!errorlevel!
if !INSTALL_ERROR! neq 0 (
    echo.
    color 0E
    echo  [!] UYARI: Standart yukleme basarisiz oldu, alternatif yontem deneniyor...
    echo.
    call npm install --force
    set INSTALL_ERROR=!errorlevel!
    if !INSTALL_ERROR! neq 0 (
        color 0C
        echo.
        echo  [X] HATA: Bagimliliklar yuklenemedi!
        echo.
        echo  Olası çözümler:
        echo  1. Internet baglantinizi kontrol edin
        echo  2. Antivirus yazilimini gecici olarak kapatmayi deneyin
        echo  3. node_modules klasorunu silip tekrar deneyin
        echo  4. npm cache clean --force komutunu calistirin
        echo.
        echo  Detayli hata mesaji icin komut isteminde su komutu calistirin:
        echo  npm install --legacy-peer-deps
        echo.
        pause
        exit /b 1
    )
)
echo.
echo  [OK] Bagimliliklar yuklendi
echo.

REM Prisma Client olustur
echo  [5/6] Prisma Client olusturuluyor...
call npm run db:generate
if !errorlevel! neq 0 (
    color 0C
    echo.
    echo  [X] HATA: Prisma Client olusturulamadi!
    echo.
    pause
    exit /b 1
)
echo  [OK] Prisma Client hazir
echo.

REM Veritabani migration
echo  [6/6] Veritabani hazirlaniyor...
call npm run db:push
if !errorlevel! neq 0 (
    color 0C
    echo.
    echo  [X] HATA: Veritabani olusturulamadi!
    echo.
    echo  Lutfen .env dosyanizda DATABASE_URL ayarinin dogru oldugundan emin olun.
    echo  PostgreSQL baglanti bilgilerini kontrol edin.
    pause
    exit /b 1
)
echo  [OK] Veritabani hazir
echo.

REM Seed verileri
echo  [7/7] Baslangic verileri yukleniyor...
call npm run db:seed
if !errorlevel! neq 0 (
    color 0E
    echo  [!] UYARI: Seed verileri yuklenemedi (devam ediliyor...)
) else (
    echo  [OK] Baslangic verileri yuklendi
)
echo.

color 0A
echo  ========================================================
echo             KURULUM TAMAMLANDI!
echo  ========================================================
echo.
echo  Yeni Ozellikler:
echo  - Şube / Hastane Seçici (Branch Switcher)
echo  - Regülasyon Uyumluluğu (EU MDR, FDA, KVKK)
echo  - Dinamik Veri Yönetimi ve Gelişmiş API
echo  - Command Palette (Ctrl+K)
echo  - PWA (Progressive Web App) Desteği
echo  - Sözleşme Yönetimi (Yeni)
echo.
echo  Kurulum tamamlandi! Simdi BASLAT.bat dosyasini calistirarak
echo  uygulamayi baslatabilirsiniz.
echo.
pause
endlocal
