$ErrorActionPreference = "Stop"

# Safe Git review helper.
# - Never uses "git add -A".
# - Never commits without exact "COMMIT ONAY".
# - Never pushes without exact "PUSH ONAY".

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath
$logPath = Join-Path $repoPath "backup.log"
$lockPath = Join-Path $repoPath ".backup.lock"

function Write-BackupLog {
    param(
        [string]$Level,
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -LiteralPath $logPath -Value "[$timestamp] [$Level] $Message" -Encoding UTF8
}

function Normalize-RepoPath {
    param([string]$Path)

    $value = String($Path ?? "").Trim()
    if (-not $value) { return "" }
    $value = $value.Replace("\", "/")
    if ($value.Contains(" -> ")) {
        $value = ($value.Split(" -> ")[-1]).Trim()
        $value = $value.Replace("\", "/")
    }
    return $value
}

function Is-RiskyPath {
    param([string]$Path)

    $p = Normalize-RepoPath $Path
    if (-not $p) { return $true }
    if ($p.StartsWith(".state-history/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p -like "demo_state.backup-*.json") { return $true }
    if ($p.Equals("demo_state.json", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.Equals("backup.log", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.Equals("health_check.log", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.EndsWith(".log", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.StartsWith("snapshots/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.StartsWith("local-history/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.StartsWith(".local-backups/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    return $false
}

function Is-SafeDefaultCandidate {
    param([string]$Path)

    $p = Normalize-RepoPath $Path
    if (-not $p) { return $false }
    if (Is-RiskyPath $p) { return $false }

    if ($p.StartsWith("src/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.Equals("style.css", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.EndsWith(".md", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.Equals("package.json", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.StartsWith("scripts/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($p.Equals(".gitignore", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

    return $false
}

function Acquire-BackupLock {
    if (Test-Path -LiteralPath $lockPath) { return $false }
    New-Item -ItemType File -Path $lockPath -Force -ErrorAction Stop | Out-Null
    return $true
}

function Release-BackupLock {
    if (Test-Path -LiteralPath $lockPath) {
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Acquire-BackupLock)) {
    Write-Output "Guvenli kontrol baska bir surecte calisiyor. Bu calisma atlandi."
    Write-BackupLog -Level "INFO" -Message "Skipped because lock file exists."
    exit 0
}

try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Not a git repository: $repoPath"
    }

    $trackedChanges = @(git diff --name-only | ForEach-Object { Normalize-RepoPath $_ } | Where-Object { $_ })
    $untrackedChanges = @(git ls-files --others --exclude-standard | ForEach-Object { Normalize-RepoPath $_ } | Where-Object { $_ })
    $allChanges = @($trackedChanges + $untrackedChanges | Sort-Object -Unique)

    if ($allChanges.Count -eq 0) {
        Write-Output "Degisiklik bulunamadi. GitHub islemi yok."
        Write-BackupLog -Level "INFO" -Message "No changes found."
        exit 0
    }

    $safeCandidates = @($allChanges | Where-Object { Is-SafeDefaultCandidate $_ })
    $riskyCandidates = @($allChanges | Where-Object { Is-RiskyPath $_ })
    $otherCandidates = @($allChanges | Where-Object { (-not (Is-SafeDefaultCandidate $_)) -and (-not (Is-RiskyPath $_)) })

    Write-Output ""
    Write-Output "==== Guvenli GitHub Kontrol Raporu ===="
    Write-Output "Toplam degisiklik: $($allChanges.Count)"
    Write-Output "Guvenli varsayilan aday (otomatik stage ETMEZ): $($safeCandidates.Count)"
    Write-Output "Riskli/veri/history/log (asla otomatik stage ETMEZ): $($riskyCandidates.Count)"
    Write-Output "Diger (manuel inceleme gerekir): $($otherCandidates.Count)"
    Write-Output ""

    if ($safeCandidates.Count -gt 0) {
        Write-Output "--- Guvenli varsayilan adaylar ---"
        $safeCandidates | ForEach-Object { Write-Output $_ }
        Write-Output ""
    }

    if ($riskyCandidates.Count -gt 0) {
        Write-Output "--- Riskli/veri/history/log (otomatik dislanir) ---"
        $riskyCandidates | ForEach-Object { Write-Output $_ }
        Write-Output ""
    }

    if ($otherCandidates.Count -gt 0) {
        Write-Output "--- Diger degisiklikler (otomatik stage edilmez) ---"
        $otherCandidates | ForEach-Object { Write-Output $_ }
        Write-Output ""
    }

    if ($safeCandidates.Count -eq 0) {
        Write-Output "Guvenli varsayilan kapsamta stage edilecek dosya yok. GitHub islemi yok."
        Write-BackupLog -Level "INFO" -Message "No safe default candidates."
        exit 0
    }

    $commitApproval = String((Read-Host "Commit icin tam olarak 'COMMIT ONAY' yaziniz (iptal icin Enter)")).Trim()
    if ($commitApproval -ne "COMMIT ONAY") {
        Write-Output "Commit onayi verilmedi. Commit/Push yapilmadi."
        Write-BackupLog -Level "INFO" -Message "Commit skipped: no COMMIT ONAY."
        exit 0
    }

    foreach ($path in $safeCandidates) {
        git add -- $path
        if ($LASTEXITCODE -ne 0) {
            throw "Staging failed for: $path"
        }
    }

    $stagedPaths = @(git diff --cached --name-only | ForEach-Object { Normalize-RepoPath $_ } | Where-Object { $_ })
    if ($stagedPaths.Count -eq 0) {
        Write-Output "Stage sonrasi commit adayi kalmadi. Commit/Push yapilmadi."
        Write-BackupLog -Level "INFO" -Message "No staged files after safe staging."
        exit 0
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $defaultMessage = "manual-safe-backup: $timestamp"
    $commitMessage = String((Read-Host "Commit mesaji (Enter = '$defaultMessage')")).Trim()
    if (-not $commitMessage) { $commitMessage = $defaultMessage }

    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "Commit failed."
    }

    $pushApproval = String((Read-Host "Push icin tam olarak 'PUSH ONAY' yaziniz (iptal icin Enter)")).Trim()
    if ($pushApproval -ne "PUSH ONAY") {
        Write-Output "Push onayi verilmedi. Commit olustu, push yapilmadi."
        Write-BackupLog -Level "INFO" -Message "Push skipped: no PUSH ONAY."
        exit 0
    }

    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    git push origin $branch
    if ($LASTEXITCODE -ne 0) {
        throw "Push failed."
    }

    $msg = "Push completed on branch $branch."
    Write-Output $msg
    Write-BackupLog -Level "INFO" -Message $msg
}
catch {
    $err = $_.Exception.Message
    Write-BackupLog -Level "ERROR" -Message $err
    throw
}
finally {
    Release-BackupLock
}
