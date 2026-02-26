$ErrorActionPreference = "Stop"

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

$logPath = Join-Path $repoPath "health_check.log"
$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$issues = @()
$notes = @()

function Add-Note([string]$msg) {
    $script:notes += $msg
}

function Add-Issue([string]$msg) {
    $script:issues += $msg
}

try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        Add-Issue "Git deposu algilanamadi."
    } else {
        Add-Note "Git repo OK"
    }
} catch {
    Add-Issue "Git kontrol hatasi: $($_.Exception.Message)"
}

try {
    $dirty = git status --porcelain
    $count = ($dirty | Measure-Object -Line).Lines
    if ($count -gt 0) {
        Add-Note "Bekleyen degisiklik var: $count dosya"
    } else {
        Add-Note "Calisma alani temiz"
    }
} catch {
    Add-Issue "Git status okunamadi: $($_.Exception.Message)"
}

try {
    schtasks /Query /TN "DULDA_GitAutoBackup_15Min" *> $null
    if ($LASTEXITCODE -ne 0) {
        Add-Issue "15 dk GitHub yedek gorevi yok: DULDA_GitAutoBackup_15Min"
    } else {
        Add-Note "15 dk yedek gorevi aktif"
    }
} catch {
    Add-Issue "Yedek gorevi kontrol hatasi: $($_.Exception.Message)"
}

try {
    $targets = @(
        "src/core/app-core.js",
        "src/modules/unit-module.js",
        "src/modules/product-library-module.js",
        "src/modules/cnc-library-module.js"
    )

    foreach ($f in $targets) {
        if (-not (Test-Path $f)) {
            Add-Issue "Dosya yok: $f"
            continue
        }
        node -e "const fs=require('fs'); new Function(fs.readFileSync('$f','utf8'));"
        if ($LASTEXITCODE -ne 0) {
            Add-Issue "JS parse hatasi: $f"
        }
    }

    if (-not ($issues | Where-Object { $_ -like "JS parse hatasi:*" })) {
        Add-Note "Hizli JS parse OK"
    }
} catch {
    Add-Issue "JS parse kontrol hatasi: $($_.Exception.Message)"
}

$summary = if ($issues.Count -eq 0) { "OK" } else { "ISSUE" }
$line = "[$now] $summary | " + (($notes + $issues) -join " | ")
Add-Content -Path $logPath -Value $line -Encoding UTF8

if ($issues.Count -gt 0) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show(
            ($issues -join [Environment]::NewLine),
            "DULDA Otomatik Kontrol Uyarisi",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        ) | Out-Null
    } catch {
        # UI gosterilemeyebilir; log zaten yazildi.
    }
}

Write-Output $line
