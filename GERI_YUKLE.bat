@echo off
setlocal enabledelayedexpansion
color 0E
chcp 65001 >nul
cls

echo.
echo ========================================================
echo     MediSync - Veritabanı Geri Yükleme Aracı
echo ========================================================
echo.
echo DİKKAT: Geri yükleme işlemi seçtiğiniz yedek dosyasındaki
echo verileri mevcut veritabanına aktaracaktır!
echo.
cd /d "%~dp0"

if not exist "backups" (
    color 0C
    echo [X] "backups" klasörü bulunamadı. Geri yüklenecek yedek yok.
    pause
    exit /b 1
)

echo Mevcut Yedek Dosyaları:
echo --------------------------------------------------------
dir /b /o:-d backups\*.json 2>nul
echo --------------------------------------------------------
echo.
set /p BACKUP_FILE="Lütfen geri yüklemek istediğiniz dosya adını yazın (örn: auto-backup-...json): "

if "%BACKUP_FILE%"=="" (
    echo [!] İptal edildi. Dosya adı girilmedi.
    pause
    exit /b 0
)

if not exist "backups\%BACKUP_FILE%" (
    color 0C
    echo [X] HATA: "backups\%BACKUP_FILE%" dosyası bulunamadı!
    pause
    exit /b 1
)

echo.
echo [*] Geri yükleme başlatılıyor: backups\%BACKUP_FILE% ...
call npx tsx scripts/restore-db.ts "backups\%BACKUP_FILE%"

if %errorLevel% equ 0 (
    color 0A
    echo.
    echo ========================================================
    echo [OK] Veritabanı başarıyla geri yüklendi!
    echo ========================================================
) else (
    color 0C
    echo.
    echo [X] Geri yükleme sırasında hata oluştu.
)

echo.
pause
