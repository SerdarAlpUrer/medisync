@echo off
title MediSync (Postgres) - Production
color 0B

echo.
echo ========================================
echo   MediSync (Postgres) - Web Application
echo   Production Start Script
echo ========================================
echo.

cd /d "%~dp0"
set PATH=%PATH%;C:\Program Files\nodejs

:: Ensure Prisma Client is generated
echo [INFO] Generating Prisma Client...
call npx prisma generate

:: Check if production build exists, if not build it
if not exist ".next\BUILD_ID" (
    echo [INFO] Build not found. Building project...
    call npm run build
)

echo [INFO] Starting Next.js Production Server on port 3000...
:: -H 0.0.0.0 is crucial for external access
call npm start
pause
