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
echo  5. Demo Sifirlama Anahtari (RESET)
echo  6. Cikis
echo.
echo ===============================================
set /p secim="Seciminiz (1-6): "

if "%secim%"=="6" goto EXIT

echo.
echo Hedef bilgisayarin "Cihaz Kodu"nu girin.
echo (Bos birakirsaniz cihaza ozel kilit OLMAZ ve her yerde calisir)
set /p machineId="Cihaz Kodu (Opsiyonel): "

if "%machineId%"=="" set machineId=ANY

if "%secim%"=="1" goto DAYS30
if "%secim%"=="2" goto DAYS365
if "%secim%"=="3" goto UNLIMITED
if "%secim%"=="4" goto CUSTOM
if "%secim%"=="5" goto RESET_KEY
if "%secim%"=="5" goto RESET_KEY

goto MENU

:DAYS30
echo.
echo [BILGI] 30 Gunluk lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=30 --machine-id=%machineId% --type=FULL
goto END

:DAYS365
echo.
echo [BILGI] 365 Gunluk (1 Yil) lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=365 --machine-id=%machineId% --type=FULL
goto END

:UNLIMITED
echo.
echo [BILGI] Sinirsiz lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=9999 --machine-id=%machineId% --type=FULL
goto END

:CUSTOM
echo.
set /p days="Gun sayisini girin: "
echo.
echo [BILGI] %days% gunluk lisans olusturuluyor...
call npx tsx scripts/keygen.ts --days=%days% --machine-id=%machineId% --type=FULL
goto END

:RESET_KEY
echo.
echo [BILGI] DEMO SIFIRLAMA (RESET) anahtari olusturuluyor...
echo Bu anahtar girildiginde demo suresi bastan baslar.
call npx tsx scripts/keygen.ts --days=0 --machine-id=%machineId% --type=RESET
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
