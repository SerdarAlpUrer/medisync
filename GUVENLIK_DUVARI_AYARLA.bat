@echo off
setlocal enabledelayedexpansion
color 0B
chcp 65001 >nul
cls

echo.
echo ========================================================
echo     MediSync - Hastane Ağı Güvenlik Duvarı Ayarlayıcı
echo ========================================================
echo.
echo Bu araç, hastanedeki diğer bilgisayarların (Servisler,
echo Yoğun Bakım, Ameliyathane, Biyomedikal Atölyesi) bu
echo sunucuya ağ üzerinden bağlanabilmesi için Windows
echo Güvenlik Duvarında 3000 portunu açar.
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

echo [*] Windows Güvenlik Duvarına MediSync TCP 3000 ve HTTPS 3443 kuralları ekleniyor...
netsh advfirewall firewall delete rule name="MediSync Tibbi Cihaz Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="MediSync Tibbi Cihaz Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any description="MediSync Biyomedikal Cihaz Takip Sistemi Ağ Erişimi" >nul 2>&1

netsh advfirewall firewall delete rule name="MediSync HTTPS (3443)" >nul 2>&1
netsh advfirewall firewall add rule name="MediSync HTTPS (3443)" dir=in action=allow protocol=TCP localport=3443 profile=any description="MediSync HTTPS Kamera ve Guvenli Ag Erisimi" >nul 2>&1

if %errorLevel% equ 0 (
    color 0A
    echo [OK] Güvenlik Duvarı kuralı başarıyla eklendi!
) else (
    color 0E
    echo [!] Kural eklenirken bir uyarı oluştu, ancak devam ediliyor.
)

echo.
echo ========================================================
echo       Hastane Yerel Ağında Kullanılacak Erişim Adresleri:
echo ========================================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    echo   ^>  http://!ip!:3000
)

echo.
echo Bu sunucu üzerinden erişmek için:
echo   ^>  http://localhost:3000
echo.
echo ========================================================
echo Diğer bilgisayarlar ve tabletlerin tarayıcısından yukarıdaki
echo yerel IP adreslerinden birini yazarak sisteme erişebilirsiniz.
echo ========================================================
echo.
pause
