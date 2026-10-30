@echo off
chcp 65001 > nul
echo ========================================================
echo   MediSync TEST Ortamini Guncelleme (Build & Restart)
echo ========================================================
cd /d "C:\medisync-test"
echo [1/3] Prisma semasi guncelleniyor...
call npx prisma generate
call npx prisma db push --skip-generate
echo [2/3] Test uygulamasi derleniyor...
call npm run build
echo [3/3] Test sunucusu yeniden baslatiliyor...
call "C:\medisync-test\stop-test.bat"
start "MediSync-Test-Server" /min node server.js
echo.
echo ========================================================
echo   Test ortami basariyla guncellendi ve baslatildi!
echo ========================================================
pause
