@echo off
title MediSync Lisans Olusturucu
color 0A
cls

:MENU
cls
echo ===============================================
echo        MEDISYNC LISANS OLUSTURUCU
echo ===============================================
echo.
echo  1. 30 Gunluk Deneme Lisansi
echo  2. 1 Yillik (365 Gun) Lisans
echo  3. Sinirsiz (Omur Boyu) Lisans
echo  4. Ozel Sure Gir
echo  5. Cikis
echo.
echo ===============================================
set /p secim="Seciminiz (1-5): "

if "%secim%"=="1" goto DAYS30
if "%secim%"=="2" goto DAYS365
if "%secim%"=="3" goto UNLIMITED
if "%secim%"=="4" goto CUSTOM
if "%secim%"=="5" goto EXIT

goto MENU

:DAYS30
echo.
echo [BILGI] 30 Gunluk lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=30
goto END

:DAYS365
echo.
echo [BILGI] 365 Gunluk (1 Yil) lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=365
goto END

:UNLIMITED
echo.
echo [BILGI] Sinirsiz lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=9999
goto END

:CUSTOM
echo.
set /p days="Gun sayisini girin: "
echo.
echo [BILGI] %days% gunluk lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=%days%
goto END

:END
echo.
echo ===============================================
echo Islem tamamlandi. Yukaridaki kodu kopyalayabilirsiniz.
echo ===============================================
pause
goto MENU

:EXIT
exit
