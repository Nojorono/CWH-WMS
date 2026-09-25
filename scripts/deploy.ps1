# Clean rebuild + restart frontend-wms (Windows)
# Usage:
#   .\scripts\deploy.ps1
#   .\scripts\deploy.ps1 -EnvFile .env.prod

param(
    [string]$EnvFile = ".env.prod"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path $EnvFile)) {
    Write-Error "Env file tidak ditemukan: $EnvFile`nCopy dulu: Copy-Item .env.prod.example .env.prod"
}

$content = Get-Content $EnvFile -Raw
if ($content -notmatch '(?m)^VITE_API_ENDPOINT=.+') {
    Write-Error "VITE_API_ENDPOINT wajib diisi di $EnvFile"
}

Write-Host "==> Env file : $EnvFile"
Write-Host "==> Stopping container..."
docker compose --env-file $EnvFile down --remove-orphans

Write-Host "==> Removing old image (clean)..."
docker image rm -f frontend-wms:latest 2>$null

Write-Host "==> Building (no-cache)..."
docker compose --env-file $EnvFile build --no-cache --pull

Write-Host "==> Starting..."
docker compose --env-file $EnvFile up -d --force-recreate

Write-Host "==> Waiting for health..."
$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3002/health" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

docker compose --env-file $EnvFile ps

if ($healthy) {
    Write-Host "==> Healthy: http://127.0.0.1:3002/health"
    exit 0
}

Write-Warning "Container belum healthy dalam 30s. Cek: docker compose --env-file $EnvFile logs --tail=100"
exit 1
