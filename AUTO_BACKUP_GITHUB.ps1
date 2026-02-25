$ErrorActionPreference = "Stop"

# Always run from the repository root (script location).
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

# Verify this is a git repository.
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Not a git repository: $repoPath"
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
