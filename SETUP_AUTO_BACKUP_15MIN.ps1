$ErrorActionPreference = "Stop"

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $repoPath "AUTO_BACKUP_GITHUB.ps1"

if (-not (Test-Path $backupScript)) {
    throw "AUTO_BACKUP_GITHUB.ps1 bulunamadi: $backupScript"
}

$taskName = "DULDA_GitAutoBackup_15Min"
$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$backupScript`""

schtasks /Create /TN $taskName /SC MINUTE /MO 15 /TR $taskCommand /F | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Zamanlanmis gorev olusturulamadi."
}

Write-Output "Olusturuldu: $taskName"
Write-Output "Komut: $taskCommand"
Write-Output "Periyot: 15 dakika"
