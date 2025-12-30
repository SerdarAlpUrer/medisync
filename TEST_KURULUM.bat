@echo off
chcp 65001 >nul
cls
echo.
echo  ========================================================
echo         BioMedicApp RC1.8 - Kurulum Test
echo  ========================================================
echo.

echo  Mevcut durum kontrol ediliyor...
echo.

if exist "node_modules" (
    echo  [OK] node_modules klasoru mevcut
    dir "node_modules" /b | find /c /v "" > temp_count.txt
    set /p COUNT=<temp_count.txt
    del temp_count.txt
    echo  [INFO] node_modules icinde yaklasik !COUNT! oge var
) else (
    echo  [X] node_modules klasoru YOK
)

echo.

if exist "package.json" (
    echo  [OK] package.json mevcut
) else (
    echo  [X] package.json YOK
)

echo.

if exist "node_modules\.prisma" (
    echo  [OK] Prisma Client mevcut
) else (
    echo  [X] Prisma Client YOK
)

echo.

if exist "prisma\dev.db" (
    echo  [OK] Veritabani mevcut
) else (
    echo  [X] Veritabani YOK
)

echo.
echo  ========================================================
echo.

if not exist "node_modules" (
    echo  SONUC: Kurulum yapilmamis!
    echo  Lutfen KURULUM.bat dosyasini calistirin.
) else (
    echo  SONUC: Kurulum yapilmis gorunuyor.
    echo  BASLAT.bat dosyasini calistirabilirsiniz.
)

echo.
pause

