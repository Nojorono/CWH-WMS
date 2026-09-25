#!/usr/bin/env bash
# Clean rebuild + restart frontend-wms
# Usage:
#   ./scripts/deploy.sh              # pakai .env.prod
#   ./scripts/deploy.sh .env.prod    # env file custom

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-.env.prod}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file tidak ditemukan: $ENV_FILE"
  echo "       Copy dulu: cp .env.prod.example .env.prod"
  exit 1
fi

if [[ -z "${VITE_API_ENDPOINT:-}" ]] && ! grep -qE '^VITE_API_ENDPOINT=.+' "$ENV_FILE"; then
  echo "ERROR: VITE_API_ENDPOINT wajib diisi di $ENV_FILE"
  exit 1
fi

echo "==> Env file : $ENV_FILE"
echo "==> Stopping container..."
docker compose --env-file "$ENV_FILE" down --remove-orphans

echo "==> Removing old image (clean)..."
docker image rm -f frontend-wms:latest 2>/dev/null || true

echo "==> Building (no-cache)..."
docker compose --env-file "$ENV_FILE" build --no-cache --pull

echo "==> Starting..."
docker compose --env-file "$ENV_FILE" up -d --force-recreate

echo "==> Waiting for health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:3002/health" >/dev/null 2>&1; then
    echo "==> Healthy: http://127.0.0.1:3002/health"
    docker compose --env-file "$ENV_FILE" ps
    exit 0
  fi
  sleep 1
done

echo "WARN: Container belum healthy dalam 30s. Cek log:"
echo "  docker compose --env-file $ENV_FILE logs --tail=100"
docker compose --env-file "$ENV_FILE" ps
exit 1
