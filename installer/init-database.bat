@echo off
title MediSync - Kurulum ve Baslangic
cd /d "%~dp0"

echo ============================================
echo    MediSync Ilk Kurulum Sihirbazi
echo ============================================
echo.

:: 1. Runtime Setup
if exist "%~dp0runtime\nodejs\node.exe" (
    set "PATH=%~dp0runtime\nodejs;%PATH%"
)
if exist "%~dp0runtime\pgsql\bin\pg_ctl.exe" (
    set "PATH=%~dp0runtime\pgsql\bin;%PATH%"
)

:: 2. Application Setup (Dependencies & Build)
echo [1/6] Uygulama bagimliliklari yukleniyor...
if not exist "node_modules" (
    call npm install --legacy-peer-deps
) else (
    echo Bagimliliklar zaten yuklu.
)

echo [2/6] Veritabani araclari hazirlaniyor...
call npx prisma generate

echo [3/6] Uygulama derleniyor (Bu islem islemci hizina gore zaman alabilir)...
if not exist ".next" (
    call npm run build
) else (
    echo Uygulama zaten derlenmis.
)

:: 3. Database Initialization
echo [4/6] Veritabani dizinleri olusturuluyor...
if not exist "data\pgsql" (
    mkdir "data\pgsql"
    mkdir "logs"
    
    echo [5/6] PostgreSQL veritabani olusturuluyor...
    initdb -D "%~dp0data\pgsql" -U postgres -E UTF8 --locale=Turkish_Turkey.1254
    
    echo PostgreSQL servisi baslatiliyor...
    start /B "" pg_ctl start -D "%~dp0data\pgsql" -l "%~dp0logs\postgresql.log"
    timeout /t 5 /nobreak > nul
    
    echo MediSync veritabani tanimlaniyor...
    psql -U postgres -c "CREATE DATABASE medisync;"
    
    echo [6/6] Tablolar ve baslangic verileriyukleniyor...
    call npx prisma db push
    call npx prisma db seed
    
    echo.
    echo ============================================
    echo    KURULUM TAMAMLANDI!
    echo ============================================
    
    :: Stop postgres so the main script can start it freshly or keep it running?
    :: Better to stop cleanly to be safe.
    echo Temizlik yapiliyor...
    pg_ctl stop -D "%~dp0data\pgsql"
) else (
    echo [BILGI] Veritabani zaten kurulu.
)

echo.
echo Islem tamamlandi. Pencere 5 saniye icinde kapanacak.
timeout /t 5
