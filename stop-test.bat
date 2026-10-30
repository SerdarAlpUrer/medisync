@echo off
chcp 65001 > nul
echo ========================================================
echo   MediSync TEST Sunucusu Durduruluyor (Port 3100 / 3543)
echo ========================================================
powershell -Command "Get-NetTCPConnection -LocalPort 3100, 3543 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
echo Test sunucusu durduruldu.
