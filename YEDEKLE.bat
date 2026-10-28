@echo off
setlocal
color 0B
chcp 65001 >nul
cls

echo.
echo ========================================================
echo     MediSync - Hızlı Veritabanı Yedekleme Aracı
echo ========================================================
echo.
cd /d "%~dp0"

echo [*] Veritabanı yedeği alınıyor...
call npx tsx scripts/backup-db.ts

if %errorLevel% equ 0 (
    color 0A
    echo.
    echo ========================================================
    echo [OK] Yedekleme işlemi başarıyla tamamlandı!
    echo Alınan yedek dosyaları "backups" klasörü içerisindedir.
    echo Bu klasörü harici bir diske veya güvenli bir ortama
    echo kopyalayarak saklayabilirsiniz.
    echo ========================================================
) else (
    color 0C
    echo.
    echo [X] Yedekleme sırasında hata oluştu. Lütfen veritabanının
    echo açık olduğundan ve bağlantı ayarlarının doğruluğundan emin olun.
)

echo.
pause
