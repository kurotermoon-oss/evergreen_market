param(
  [string]$DatabaseUrl = $env:REMOTE_DATABASE_URL,
  [string]$BackupDir = "server/backups"
)

$ErrorActionPreference = "Stop"

if (!$DatabaseUrl) {
  throw "DatabaseUrl is empty. Pass -DatabaseUrl or set REMOTE_DATABASE_URL."
}

if (!(Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$backupPath = Resolve-Path $BackupDir
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$fileName = "evergreen_market_remote_$stamp.dump"

Write-Host "Creating remote PostgreSQL backup..."
Write-Host "Output: $BackupDir\$fileName"

docker run --rm `
  -v "${backupPath}:/backups" `
  postgres:16 `
  pg_dump `
  $DatabaseUrl `
  -Fc `
  -f "/backups/$fileName"

Write-Host ""
Write-Host "Remote backup created successfully:"
Write-Host "$BackupDir\$fileName"