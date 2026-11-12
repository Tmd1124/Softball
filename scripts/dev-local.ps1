# Runs the whole site locally: PHP API on :8000 (SQLite in .local/dev.sqlite) + Vite on :5173.
# First time only: create the local accounts (see README, "Local testing").
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$php = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\PHP.PHP.NTS.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
if (-not (Test-Path $php)) { $php = (Get-Command php -ErrorAction Stop).Source }

New-Item -ItemType Directory -Force .local | Out-Null
$env:EVERHARRIS_DB_DSN = 'sqlite:' + (Join-Path $root '.local\dev.sqlite')
$env:EVERHARRIS_DB_USER = ''
$env:EVERHARRIS_DB_PASS = ''

$server = Start-Process $php -ArgumentList '-S', 'localhost:8000', '-t', 'public' -PassThru -WindowStyle Hidden
try {
  Write-Host 'Open http://localhost:5173  (Ctrl+C to stop)'
  npm run dev
} finally {
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
