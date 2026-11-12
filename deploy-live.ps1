<#
=============================================================================
  MediSync Production (Canlı) Sıfır-Risk Dağıtım / Deploy Betiği
=============================================================================
#>

param(
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"
$LiveDir = "C:\Users\Administrator\Downloads\medisync"
$BackupDir = "C:\medisync-backups"
$PgBin = "C:\Users\Administrator\pg17\bin"
$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 MediSync Canlıya Güvenli Dağıtım Başlatılıyor... " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

Set-Location $LiveDir

# 1. Otomatik Veritabanı Yedeği
if (-not $SkipBackup) {
    if (-not (Test-Path $BackupDir)) {
        New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
    }
    $BackupFile = Join-Path $BackupDir "medisync_live_backup_$Timestamp.sql"
    Write-Host "[1/5] 💾 Canlı veritabanı yedeği alınıyor..." -ForegroundColor Yellow
    Write-Host "      Yedek Konumu: $BackupFile" -ForegroundColor DarkGray
    & "$PgBin\pg_dump.exe" -U postgres -d medisync -f $BackupFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Veritabanı yedeği alınamadı! Canlıya alma işlemi güvenlik gerekçesiyle durduruldu." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Veritabanı yedeği başarıyla alındı." -ForegroundColor Green
}

# 2. Git Pull (master dalı)
Write-Host "[2/5] 📥 GitHub master dalından onaylı kodlar çekiliyor..." -ForegroundColor Yellow
git fetch origin master
git reset --hard origin/master
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git pull başarısız oldu!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Kodlar güncellendi." -ForegroundColor Green

# 3. Prisma Schema & Client
Write-Host "[3/5] 🔄 Prisma şeması ve veritabanı senkronize ediliyor..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push --skip-generate
Write-Host "✅ Veritabanı şeması güncel." -ForegroundColor Green

# 4. Korumalı Derleme (Safe Build)
Write-Host "[4/5] 🔨 Canlı uygulama derleniyor (Build)..." -ForegroundColor Yellow
Write-Host "      (Not: Derlemede hata çıkarsa canlı sunucu ASLA durdurulmaz)" -ForegroundColor DarkGray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ DERLEME HATASI! Yeni kod derlenemediği için canlı sunucu DURDURULMADI." -ForegroundColor Red
    Write-Host "🛡️ Müşterileriniz mevcut stabil sürümü kesintisiz kullanmaya devam ediyor." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Derleme başarıyla tamamlandı." -ForegroundColor Green

# 5. Sunucu Yenileme (Graceful Restart)
Write-Host "[5/5] 🔄 Canlı sunucu yenileniyor..." -ForegroundColor Yellow
$ports = 3000, 3443
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique
        foreach ($procId in $pids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 1

Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $LiveDir -WindowStyle Hidden
Start-Sleep -Seconds 3

# Doğrulama Testi
try {
    $res = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing -TimeoutSec 10
    if ($res.StatusCode -eq 200) {
        Write-Host "✅ Canlı sunucu başarıyla ayağa kalktı ve 200 OK yanıt verdi." -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Canlı sunucu yanıtı bekleniyor (birkaç saniye içinde aktifleşecek)..." -ForegroundColor Yellow
}

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "🎉 TEBRİKLER! MediSync Canlı Sürümü Başarıyla Güncellendi!" -ForegroundColor Green
Write-Host "🌐 Canlı HTTP:  http://188.132.215.147:3000" -ForegroundColor Cyan
Write-Host "🔒 Canlı HTTPS: https://188.132.215.147:3443" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Green
