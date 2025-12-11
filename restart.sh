#!/bin/bash

# Restart script for frontend-wms Docker container
# Usage: ./restart.sh

set -e

echo "🔄 Restarting frontend-wms container..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop and remove container if running
if docker ps -a | grep -q frontend-wms; then
    echo "🛑 Stopping existing container..."
    docker-compose down
fi

# Start container
echo "🚀 Starting container..."
docker-compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for container to start..."
sleep 5

# Check container status
if docker ps | grep -q frontend-wms; then
    echo "✅ Container restarted successfully!"
    echo ""
    echo "📊 Container status:"
    docker ps | grep frontend-wms
    echo ""
    echo "📋 Recent logs:"
    docker logs --tail 20 frontend-wms
else
    echo "❌ Container failed to start!"
    echo ""
    echo "📋 Error logs:"
    docker-compose logs
    exit 1
fi

