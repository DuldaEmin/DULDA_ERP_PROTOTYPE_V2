$ErrorActionPreference = "Stop"

# Always run from the repository root (script location).
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath
$logPath = Join-Path $repoPath "backup.log"
$lockPath = Join-Path $repoPath ".backup.lock"
$temporaryIndexPath = Join-Path $repoPath ".backup-index.tmp"

function Write-BackupLog {
    param(
        [string]$Level,
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -LiteralPath $logPath -Value "[$timestamp] [$Level] $Message" -Encoding UTF8
}

function Test-MojibakeFiles {
    $textExt = @(".js", ".html", ".css", ".md", ".json", ".ps1", ".bat", ".txt")
    $badFiles = @()
    $pattern = '[\u00C3\u00C4\u00C5\u00E2\uFFFD\x80-\x9F]'

    $tracked = git ls-files
    foreach ($file in $tracked) {
        $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        if ($textExt -notcontains $ext) { continue }
        if (-not (Test-Path $file)) { continue }

        $content = Get-Content -Raw -Encoding UTF8 $file
        if ($content -match $pattern) {
            $badFiles += $file
        }
    }

    return $badFiles
}

function Is-MeaningfulBackupPath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    $normalized = $Path.Replace('\', '/').Trim()
    if ($normalized.StartsWith(".state-history/", [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    if ($normalized.Equals("health_check.log", [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    if ($normalized.Equals("backup.log", [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    if ($normalized.Equals(".backup.lock", [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    return $true
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
    Write-Output "Backup baska bir surecte devam ediyor. Bu calisma atlandi."
    Write-BackupLog -Level "INFO" -Message "Skipped because lock file exists."
    exit 0
}

try {
    # Verify this is a git repository.
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Not a git repository: $repoPath"
    }

    # Guard: stop backup if likely mojibake exists.
    $mojibakeFiles = Test-MojibakeFiles
    if ($mojibakeFiles.Count -gt 0) {
        $list = $mojibakeFiles -join ", "
        Write-Warning "Encoding warning: possible broken characters in $list. Backup devam ediyor."
    }

    # Use a temporary index to avoid changing user's staged state.
    if (Test-Path -LiteralPath $temporaryIndexPath) {
        Remove-Item -LiteralPath $temporaryIndexPath -Force -ErrorAction SilentlyContinue
    }
    $env:GIT_INDEX_FILE = $temporaryIndexPath

    git read-tree HEAD
    if ($LASTEXITCODE -ne 0) {
        throw "Index prepare failed."
    }

    git add -A
    if ($LASTEXITCODE -ne 0) {
        throw "Staging failed."
    }

    $stagedPaths = @(git diff --cached --name-only | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $meaningfulPaths = @($stagedPaths | Where-Object { Is-MeaningfulBackupPath $_ })

    if ($meaningfulPaths.Count -eq 0) {
        Write-Output "Anlamli degisiklik bulunamadi. Backup atlandi."
        Write-BackupLog -Level "INFO" -Message "Skipped: no meaningful staged changes."
        exit 0
    }

    foreach ($path in $stagedPaths) {
        if (-not (Is-MeaningfulBackupPath $path)) {
            git reset -q HEAD -- $path *> $null
        }
    }

    $pending = git diff --cached --name-only
    if ([string]::IsNullOrWhiteSpace($pending)) {
        Write-Output "Anlamli degisiklik bulunamadi. Backup atlandi."
        Write-BackupLog -Level "INFO" -Message "Skipped: staged set became empty after filtering."
        exit 0
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "auto-backup: $timestamp"
    if ($LASTEXITCODE -ne 0) {
        throw "Commit failed."
    }

    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    git push origin $branch
    if ($LASTEXITCODE -ne 0) {
        throw "Push failed."
    }

    $msg = "Backup completed at $timestamp on branch $branch."
    Write-Output $msg
    Write-BackupLog -Level "INFO" -Message $msg
}
catch {
    $err = $_.Exception.Message
    Write-BackupLog -Level "ERROR" -Message $err
    throw
}
finally {
    if (Test-Path Env:\GIT_INDEX_FILE) {
        Remove-Item Env:\GIT_INDEX_FILE -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $temporaryIndexPath) {
        Remove-Item -LiteralPath $temporaryIndexPath -Force -ErrorAction SilentlyContinue
    }
    Release-BackupLock
}
