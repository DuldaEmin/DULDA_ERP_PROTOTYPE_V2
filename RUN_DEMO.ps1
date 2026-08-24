$preferredPort = 5500
$maxPort = 5520
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $root "AUTO_BACKUP_GITHUB.ps1"

function Test-PortInUse {
    param([int]$Port)

    try {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        return ($null -ne $listeners)
    }
    catch {
        return $false
    }
}

function Invoke-ExitBackupPrompt {
    if (-not (Test-Path -LiteralPath $backupScript)) {
        Write-Host "Backup script bulunamadi: $backupScript" -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host "Not: Bu adim otomatik GitHub push yapmaz." -ForegroundColor Yellow
    $answer = Read-Host "Guvenli Git kontrol raporu calistirilsin mi? (E/H)"
    $normalized = ($answer | ForEach-Object { $_.ToString().Trim().ToLowerInvariant() })

    if ($normalized -in @("e", "evet", "y", "yes")) {
        Write-Host "Guvenli kontrol calistiriliyor..." -ForegroundColor Cyan
        try {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $backupScript
        }
        catch {
            Write-Host "Guvenli kontrol calisirken hata olustu: $($_.Exception.Message)" -ForegroundColor Red
        }
        return
    }

    Write-Host "Guvenli kontrol atlandi." -ForegroundColor Yellow
}

$port = $preferredPort
while ((Test-PortInUse -Port $port) -and ($port -lt $maxPort)) {
    $port++
}

if (Test-PortInUse -Port $port) {
    Write-Host "Bos port bulunamadi ($preferredPort-$maxPort)." -ForegroundColor Red
    exit 1
}

Write-Host "Dulda ERP Demo baslatiliyor..." -ForegroundColor Cyan
Write-Host "Klasor: $root"
if ($port -ne $preferredPort) {
    Write-Host "Not: $preferredPort portu dolu, $port portu kullaniliyor." -ForegroundColor Yellow
}
Write-Host "Adres : http://localhost:$port/index.html" -ForegroundColor Green

Set-Location $root
Start-Process "http://localhost:$port/index.html"

try {
    node .\serve.js $port
}
catch {
    Write-Host "Node.js bulunamadi. Lutfen Node.js kurup tekrar deneyin." -ForegroundColor Red
}
finally {
    Invoke-ExitBackupPrompt
}
