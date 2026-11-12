@echo off
color 0E
chcp 65001 >nul
cls

echo.
echo ========================================================
echo     MediSync - Otomatik Başlatma Kaldırma Aracı
echo ========================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo [!] HATA: Bu işlem için Yönetici (Administrator) yetkisi gereklidir.
    echo Lütfen bu dosyaya SAĞ TIKLAYIP "Yönetici olarak çalıştır" seçeneğini seçin.
    echo.
    pause
    exit /b 1
)

set "TASK_NAME=MediSync_Server_AutoStart"

echo [*] '%TASK_NAME%' görevi Windows Görev Zamanlayıcısından kaldırılıyor...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

if %errorLevel% equ 0 (
    color 0A
    echo [OK] Otomatik Başlatma görevi başarıyla kaldırıldı.
) else (
    echo [i] Görev bulunamadı veya zaten silinmişti.
)

echo.
pause
