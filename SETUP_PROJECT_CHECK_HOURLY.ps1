$ErrorActionPreference = "Stop"

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$checkScript = Join-Path $repoPath "AUTO_PROJECT_CHECK.ps1"

if (-not (Test-Path $checkScript)) {
    throw "AUTO_PROJECT_CHECK.ps1 bulunamadi: $checkScript"
}

$taskName = "DULDA_ProjectCheck_Hourly"
$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$checkScript`""

schtasks /Create /TN $taskName /SC MINUTE /MO 60 /TR $taskCommand /F | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Zamanlanmis gorev olusturulamadi."
}

Write-Output "Olusturuldu: $taskName"
Write-Output "Komut: $taskCommand"
Write-Output "Periyot: 60 dakika"
