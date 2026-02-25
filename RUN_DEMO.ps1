$preferredPort = 5500
$maxPort = 5520
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

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
