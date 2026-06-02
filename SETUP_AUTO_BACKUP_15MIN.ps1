$ErrorActionPreference = "Stop"

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

Write-Output "Bu script guvenlik nedeniyle otomatik GitHub commit/push gorevi OLUSTURMAZ."
Write-Output "COMMIT ONAY ve PUSH ONAY olmadan GitHub islemi yapilmamalidir."
Write-Output ""

$legacyTasks = @(
    "DULDA_GitAutoBackup_15Min",
    "DULDA_ERP_AutoBackup_15Min",
    "DULDA_GitAutoBackup_Daily"
)

function Invoke-Schtasks {
    param([string[]]$ArgumentList)
    $proc = Start-Process -FilePath "schtasks.exe" -ArgumentList $ArgumentList -NoNewWindow -Wait -PassThru
    return $proc.ExitCode
}

foreach ($taskName in $legacyTasks) {
    Invoke-Schtasks @("/End", "/TN", $taskName) | Out-Null
    Invoke-Schtasks @("/Change", "/TN", $taskName, "/DISABLE") | Out-Null
}

Write-Output "Eski otomatik GitHub gorevleri (varsa) devre disi birakildi."
Write-Output "Yeni otomatik GitHub gorevi olusturulmadi."
