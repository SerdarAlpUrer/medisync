@echo off
setlocal enabledelayedexpansion
color 0B
chcp 65001 >nul
cls
echo.
echo  ========================================================
echo         MediSync Version 1 - Setup Olusturucu
echo  ========================================================
echo.

REM Inno Setup kontrolu
set "ISCC_PATH="

REM Varsayilan kurulum konumlarini kontrol et
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files\Inno Setup 6\ISCC.exe"
) else if exist "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" (
    set "ISCC_PATH=C:\Program Files (x86)\Inno Setup 5\ISCC.exe"
)

if "!ISCC_PATH!"=="" (
    color 0C
    echo  [X] HATA: Inno Setup bulunamadi!
    echo.
    echo  Lutfen Inno Setup'i indirip kurun:
    echo  https://jrsoftware.org/isdl.php
    echo.
    echo  Kurulumdan sonra bu dosyayi tekrar calistirin.
    echo.
    pause
    exit /b 1
)

echo  [OK] Inno Setup bulundu: !ISCC_PATH!
echo.

REM Output klasorunu olustur
if not exist "output" mkdir output

echo  [INFO] Setup dosyasi olusturuluyor...
echo.

REM Setup dosyasini olustur
"!ISCC_PATH!" "setup\medisync-setup.iss"

if !errorlevel! neq 0 (
    color 0C
    echo.
    echo  [X] HATA: Setup olusturulamadi!
    echo.
    pause
    exit /b 1
)

echo.
color 0A
echo  ========================================================
echo           SETUP DOSYASI BASARIYLA OLUSTURULDU!
echo  ========================================================
echo.
echo  Setup dosyasi: output\MediSync_Setup_v1.0.0.exe
echo.
echo  Bu dosyayi diger bilgisayarlara kopyalayarak
echo  MediSync'i kurabilirsiniz.
echo.
pause
endlocal
