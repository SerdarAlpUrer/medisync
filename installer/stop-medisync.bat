@echo off
title MediSync - Durduruluyor...
cd /d "%~dp0"

set PGSQL_PATH=%~dp0runtime\pgsql

echo MediSync durduruluyor...

:: Stop Node.js
taskkill /F /IM node.exe 2>nul

:: Stop PostgreSQL
"%PGSQL_PATH%\bin\pg_ctl.exe" stop -D "%~dp0data\pgsql" 2>nul

echo MediSync durduruldu.
timeout /t 3
