$ErrorActionPreference = "Stop"

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $repoPath "AUTO_BACKUP_GITHUB.ps1"

if (-not (Test-Path $backupScript)) {
    throw "AUTO_BACKUP_GITHUB.ps1 bulunamadi: $backupScript"
}

$dailyTaskName = "DULDA_GitAutoBackup_Daily"
$taskArguments = "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`""
$triggerAt = (Get-Date).AddMinutes(2)
$startTime = $triggerAt.ToString("HH:mm")

function Invoke-Schtasks {
    param([string[]]$ArgumentList)
    $proc = Start-Process -FilePath "schtasks.exe" -ArgumentList $ArgumentList -NoNewWindow -Wait -PassThru
    return $proc.ExitCode
}

foreach ($legacyTask in @("DULDA_GitAutoBackup_15Min", "DULDA_ERP_AutoBackup_15Min", "DULDA_ProjectCheck_Hourly")) {
    Invoke-Schtasks @("/End", "/TN", $legacyTask) | Out-Null
    Invoke-Schtasks @("/Change", "/TN", $legacyTask, "/DISABLE") | Out-Null
}

Unregister-ScheduledTask -TaskName $dailyTaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $taskArguments
$trigger = New-ScheduledTaskTrigger -Daily -At $triggerAt
Register-ScheduledTask -TaskName $dailyTaskName -Action $action -Trigger $trigger -Force | Out-Null

Write-Output "Olusturuldu: $dailyTaskName"
Write-Output "Komut: powershell.exe $taskArguments"
Write-Output "Periyot: 24 saat"
Write-Output "Baslangic saati: $startTime"
