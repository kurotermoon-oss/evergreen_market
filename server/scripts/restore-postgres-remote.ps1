param(
  [string]$DatabaseUrl = $env:REMOTE_DATABASE_URL,
  [string]$BackupFile = "",
  [switch]$Yes
)

$ErrorActionPreference = "Stop"

if (!$DatabaseUrl) {
  throw "DatabaseUrl is empty. Pass -DatabaseUrl or set REMOTE_DATABASE_URL."
}

if (!$BackupFile) {
  $latest = Get-ChildItem "server/backups" -Filter "*.dump" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (!$latest) {
    throw "No .dump backup files found in server/backups"
  }

  $BackupFile = $latest.FullName
}

if (!(Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$backupDirectory = Split-Path $BackupFile -Parent
$backupFileName = Split-Path $BackupFile -Leaf
$backupPath = Resolve-Path $backupDirectory

Write-Host "Restore remote PostgreSQL database from backup:"
Write-Host $BackupFile
Write-Host ""

if (!$Yes) {
  $answer = Read-Host "This can overwrite remote database data. Type RESTORE_REMOTE to continue"

  if ($answer -ne "RESTORE_REMOTE") {
    Write-Host "Remote restore cancelled."
    exit 0
  }
}

docker run --rm `
  -v "${backupPath}:/backups" `
  postgres:16 `
  pg_restore `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  -d $DatabaseUrl `
  "/backups/$backupFileName"

Write-Host ""
Write-Host "Remote restore completed successfully."