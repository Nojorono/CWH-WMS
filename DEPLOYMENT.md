# Deployment Guide - Frontend WMS

Deployment guide untuk frontend-wms di EC2 Ubuntu menggunakan Docker dan Nginx.

## Prerequisites

1. **EC2 Ubuntu Server** (20.04 atau lebih baru)
2. **Docker** dan **Docker Compose** terinstall
3. **Nginx** terinstall di host
4. **Domain** `dev-wms.nna-id.com` sudah diarahkan ke IP server
5. **SSL Certificate** (Let's Encrypt recommended)

## Step 1: Install Dependencies

### Install Docker
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
# Logout dan login kembali
```

### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Step 2: Setup Project

```bash
# Clone atau upload project ke server
cd /opt
sudo mkdir -p wms
sudo chown $USER:$USER wms
cd wms

# Upload frontend-wms folder ke sini
# Atau clone dari git repository
```

## Step 3: Configure Environment Variables

```bash
cd frontend-wms

# Edit docker-compose.yml dan update environment variables
# Atau export sebelum menjalankan deploy.sh
export VITE_API_ENDPOINT="https://api-dev-wms.nna-id.com/api"
export VITE_S3_ENDPOINT="https://nna-app-s3.s3.ap-southeast-3.amazonaws.com"
```

## Step 4: Build and Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

Atau manual:
```bash
docker-compose build --build-arg VITE_API_ENDPOINT="https://api-dev-wms.nna-id.com/api"
docker-compose up -d
```

## Step 5: Setup Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp nginx-host.conf /etc/nginx/sites-available/dev-wms.nna-id.com

# Edit file dan update SSL certificate paths (jika sudah ada)
sudo nano /etc/nginx/sites-available/dev-wms.nna-id.com

# Create symlink
sudo ln -s /etc/nginx/sites-available/dev-wms.nna-id.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 6: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d dev-wms.nna-id.com

# Auto-renewal (should be automatic, but verify)
sudo certbot renew --dry-run
```

## Step 7: Verify Deployment

1. Check Docker container:
```bash
docker ps
docker logs frontend-wms
```

2. Check Nginx:
```bash
sudo systemctl status nginx
sudo nginx -t
```

3. Test from browser:
   - HTTP: http://dev-wms.nna-id.com (should redirect to HTTPS)
   - HTTPS: https://dev-wms.nna-id.com

## Troubleshooting

### Container tidak start
```bash
docker-compose logs
docker ps -a
```

### Nginx error
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port sudah digunakan
```bash
# Check port 3000
sudo lsof -i :3000
# Or change port in docker-compose.yml
```

### SSL Certificate issues
```bash
sudo certbot certificates
sudo certbot renew
```

## Update Deployment

```bash
cd /opt/wms/frontend-wms

# Pull latest code (if using git)
git pull

# Rebuild and restart
./deploy.sh production
# Or
docker-compose down
docker-compose build
docker-compose up -d
```

## Monitoring

### View logs
```bash
# Docker logs
docker logs -f frontend-wms

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health check
```bash
curl http://localhost:3000/health
curl https://dev-wms.nna-id.com/health
```

## Environment Variables

Update environment variables di `docker-compose.yml` atau export sebelum build:

- `VITE_API_ENDPOINT`: Backend API endpoint
- `VITE_S3_ENDPOINT`: S3 endpoint untuk file uploads

## Notes

- Frontend container runs on port 3000 internally
- Nginx reverse proxy handles SSL and routes to container
- Static assets are cached for 1 year
- SPA routing is handled by Nginx (all routes → index.html)

