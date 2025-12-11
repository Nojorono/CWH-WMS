# Multi-stage build for production
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (with fallback for npm ci)
RUN if [ ! -f package-lock.json ]; then \
      echo "Warning: package-lock.json not found, generating it..." && \
      npm install --package-lock-only; \
    fi && \
    (npm ci --prefer-offline --no-audit || (echo "npm ci failed, falling back to npm install..." && npm install --no-audit))

# Copy configuration files
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.cjs ./
COPY postcss.config.js ./
COPY eslint.config.js ./

# Copy source code
COPY . .

# Build the application
# Build-time environment variables can be passed via --build-arg
ARG VITE_API_ENDPOINT
ARG VITE_S3_ENDPOINT
ENV VITE_API_ENDPOINT=${VITE_API_ENDPOINT}
ENV VITE_S3_ENDPOINT=${VITE_S3_ENDPOINT}

RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx cache directory
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
