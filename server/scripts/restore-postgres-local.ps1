param(
  [string]$Container = "evergreen_postgres",
  [string]$DbUser = "evergreen",
  [string]$DbName = "evergreen_market",
  [string]$BackupFile = "",
  [switch]$Yes
)

$ErrorActionPreference = "Stop"

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

Write-Host "Restore PostgreSQL database from backup:"
Write-Host $BackupFile
Write-Host ""
Write-Host "Target container: $Container"
Write-Host "Target database: $DbName"
Write-Host ""

if (!$Yes) {
  $answer = Read-Host "This can overwrite current database data. Type RESTORE to continue"

  if ($answer -ne "RESTORE") {
    Write-Host "Restore cancelled."
    exit 0
  }
}

$containerFile = "/tmp/evergreen_restore.dump"

docker cp $BackupFile "${Container}:${containerFile}"

docker exec $Container pg_restore `
  -U $DbUser `
  -d $DbName `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  $containerFile

docker exec $Container rm -f $containerFile | Out-Null

Write-Host ""
Write-Host "Restore completed successfully."