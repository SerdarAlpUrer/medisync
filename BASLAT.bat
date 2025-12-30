@echo off
setlocal enabledelayedexpansion
color 0A
chcp 65001 >nul
cls
echo.
echo  ========================================================
echo         MediSync Version 1 - Baslatma
echo  ========================================================
echo.

REM Node.js kontrolu
where node >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: Node.js kurulu degil!
    echo.
    echo  Lutfen once KURULUM.bat dosyasini calistirin.
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js bulundu
echo.

REM node_modules kontrolu - daha detayli
if not exist "node_modules" (
    color 0C
    echo  [X] HATA: node_modules klasoru bulunamadi!
    echo.
    echo  Bu, bagimliliklarin yuklenmedigi anlamina gelir.
    echo  Lutfen once KURULUM.bat dosyasini calistirin.
    echo.
    pause
    exit /b 1
)

REM node_modules icinde en az bir paket var mi kontrol et
dir "node_modules" /b >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo  [X] HATA: node_modules klasoru bos!
    echo.
    echo  Lutfen once KURULUM.bat dosyasini calistirin.
    echo.
    pause
    exit /b 1
)

echo  [OK] Bagimliliklar yuklu
echo.

REM package.json kontrolu
if not exist "package.json" (
    color 0C
    echo  [X] HATA: package.json dosyasi bulunamadi!
    echo.
    echo  Yanlis klasorde olabilirsiniz.
    echo  Lutfen proje klasorunde oldugunuzdan emin olun.
    echo.
    pause
    exit /b 1
)

REM Prisma kontrolu - yoksa olustur
if not exist "node_modules\.prisma" (
    color 0E
    echo  [!] UYARI: Prisma Client bulunamadi, olusturuluyor...
    call npm run db:generate
    if !errorlevel! neq 0 (
        color 0C
        echo  [X] HATA: Prisma Client olusturulamadi!
        echo.
        echo  Lutfen once KURULUM.bat dosyasini calistirin.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Prisma Client olusturuldu
    echo.
) else (
    echo  [OK] Prisma Client hazir
    echo.
)

REM Veritabani kontrolu
REM PostgreSQL kullanildigi icin dosya kontrolu yapilmiyor.
REM Veritabaninin hazir oldugu varsayiliyor.

color 0A
echo             SUNUCU BASLATILIYOR...
echo.
echo  Yeni Ozellikler:
echo  - Şube / Hastane Seçici (Branch Switcher)
echo  - Regülasyon Uyumluluğu (EU MDR, FDA, KVKK)
echo  - Dinamik Veri Yönetimi ve Gelişmiş API
echo  - Command Palette (Ctrl+K veya Cmd+K)
echo  - PWA (Progressive Web App) Desteği
echo  - Gelişmiş Bildirim Sistemi
echo.
echo  ========================================================
echo  ^> Tarayicinizda su adresi acin: http://localhost:3000
echo  ^> Durdurmak icin: CTRL + C
echo  ========================================================
echo.

REM Sunucuyu baslat
call npm run dev

REM Eger buraya gelirse, sunucu kapandi demektir
if !errorlevel! neq 0 (
    echo.
    color 0C
    echo  [X] Sunucu baslatilamadi!
    echo.
    echo  Olası nedenler:
    echo  1. Port 3000 zaten kullaniliyor olabilir
    echo  2. node_modules eksik veya bozuk olabilir
    echo  3. Prisma Client olusturulmamis olabilir
    echo.
    echo  Cozum:
    echo  - KURULUM.bat dosyasini tekrar calistirin
    echo  - Veya komut isteminde: npm run dev
    echo.
)

echo.
echo  Sunucu durduruldu.
pause
endlocal
