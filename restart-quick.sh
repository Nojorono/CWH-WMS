#!/bin/bash

# Quick restart script (without rebuilding)
# Usage: ./restart-quick.sh

set -e

echo "⚡ Quick restart frontend-wms container..."

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Restart container (no rebuild, just stop and start)
docker-compose restart

echo "✅ Container restarted!"
echo ""
docker ps | grep frontend-wms

