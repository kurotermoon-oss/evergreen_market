param(
  [string]$Container = "evergreen_postgres",
  [string]$DbUser = "evergreen",
  [string]$DbName = "evergreen_market",
  [string]$BackupDir = "server/backups"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$fileName = "evergreen_market_local_$stamp.dump"
$containerFile = "/tmp/$fileName"
$localFile = Join-Path $BackupDir $fileName

Write-Host "Creating local PostgreSQL backup..."
Write-Host "Container: $Container"
Write-Host "Database: $DbName"
Write-Host "Output: $localFile"

docker exec $Container pg_dump -U $DbUser -d $DbName -Fc -f $containerFile

docker cp "${Container}:${containerFile}" $localFile

docker exec $Container rm -f $containerFile | Out-Null

Write-Host ""
Write-Host "Backup created successfully:"
Write-Host $localFile