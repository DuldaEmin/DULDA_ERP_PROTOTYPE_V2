$ErrorActionPreference = "Stop"

# Always run from the repository root (script location).
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

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

# Stage everything and check if there is anything to commit.
git add -A
$pending = git status --porcelain
if ([string]::IsNullOrWhiteSpace($pending)) {
    Write-Output "No changes to back up."
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

Write-Output "Backup completed at $timestamp on branch $branch."
