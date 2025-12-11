#!/bin/bash

# Deployment script for frontend-wms on EC2 Ubuntu
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
DOMAIN="dev-wms.nna-id.com"
API_ENDPOINT=${VITE_API_ENDPOINT:-"https://api-dev-wms.nna-id.com/api"}
S3_ENDPOINT=${VITE_S3_ENDPOINT:-"https://nna-app-s3.s3.ap-southeast-3.amazonaws.com"}

echo "🚀 Starting deployment for $ENVIRONMENT environment..."
echo "📍 Domain: $DOMAIN"
echo "🔗 API Endpoint: $API_ENDPOINT"

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

# Build and start containers
echo "📦 Building Docker image..."
docker-compose build \
    --build-arg VITE_API_ENDPOINT="$API_ENDPOINT" \
    --build-arg VITE_S3_ENDPOINT="$S3_ENDPOINT"

echo "🔄 Starting containers..."
docker-compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for container to be healthy..."
sleep 5

# Check container status
if docker ps | grep -q frontend-wms; then
    echo "✅ Container is running!"
    docker ps | grep frontend-wms
else
    echo "❌ Container failed to start!"
    docker-compose logs
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend is available at: http://localhost:3000"
echo ""
echo "📝 Next steps:"
echo "1. Configure Nginx reverse proxy (see nginx-host.conf)"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Update DNS records to point $DOMAIN to this server"

