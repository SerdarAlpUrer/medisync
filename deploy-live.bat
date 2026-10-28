@echo off
chcp 65001 > nul
cls
echo ========================================================
echo   MediSync Canliya Dagitim (Deploy to Production)
echo ========================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-live.ps1"
echo.
pause
