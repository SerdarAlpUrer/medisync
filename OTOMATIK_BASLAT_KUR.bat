@echo off
setlocal enabledelayedexpansion
color 0B
chcp 65001 >nul
cls

echo.
echo ========================================================
echo     MediSync - Otomatik Başlatma Kurulum Aracı
echo ========================================================
echo.
echo Bu araç, Windows açıldığında MediSync sunucusunun
echo otomatik olarak arka planda çalışmasını sağlar.
echo Sunucu elektrik kesintisi veya yeniden başlatma
echo sonrasında kendiliğinden aktif hale gelecektir.
echo.

:: Yönetici Yetkisi Kontrolü
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo [!] HATA: Bu işlem için Yönetici (Administrator) yetkisi gereklidir.
    echo Lütfen bu dosyaya SAĞ TIKLAYIP "Yönetici olarak çalıştır" seçeneğini seçin.
    echo.
    pause
    exit /b 1
)

set "APP_DIR=%~dp0"
:: Sondaki ters slash'ı kaldır
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

set "TASK_NAME=MediSync_Server_AutoStart"
set "RUN_SCRIPT=%APP_DIR%\start_prod.bat"

echo [*] Çalışma Dizini: %APP_DIR%
echo [*] Başlatılacak Betik: %RUN_SCRIPT%
echo.

:: Varsa eski görevi sil
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Windows Görev Zamanlayıcısına sistem başlangıcında yüksek yetkili görev olarak ekle
schtasks /create /tn "%TASK_NAME%" /tr "\"%RUN_SCRIPT%\"" /sc onlogon /rl highest /f >nul 2>&1

if %errorLevel% equ 0 (
    color 0A
    echo [OK] Otomatik Başlatma görevi başarıyla oluşturuldu!
    echo.
    echo Görev Adı: %TASK_NAME%
    echo Tetikleyici: Kullanıcı oturum açtığında otomatik başlar (En Yüksek Yetki)
    echo.
    echo İptal etmek isterseniz OTOMATIK_BASLAT_KALDIR.bat dosyasını çalıştırabilirsiniz.
) else (
    color 0C
    echo [X] Görev oluşturulurken hata oluştu!
)

echo.
pause
