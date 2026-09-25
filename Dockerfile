# Tahap 1: Build
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite inject VITE_* saat build — harus di-pass sebagai ARG/ENV
ARG VITE_ENV=production
ARG VITE_API_ENDPOINT
ARG VITE_S3_ENDPOINT
ARG VITE_SERVER47
ARG VITE_META_SERVICE
ARG VITE_DO_SUGGESTION_SERVICE
ARG VITE_DMS_APP_ID
ARG VITE_DMS_APP_SECRET
ARG VITE_SNOWFLAKE_API_URL
ARG VITE_SNOWFLAKE_TOKEN

ENV VITE_ENV=$VITE_ENV \
    VITE_API_ENDPOINT=$VITE_API_ENDPOINT \
    VITE_S3_ENDPOINT=$VITE_S3_ENDPOINT \
    VITE_SERVER47=$VITE_SERVER47 \
    VITE_META_SERVICE=$VITE_META_SERVICE \
    VITE_DO_SUGGESTION_SERVICE=$VITE_DO_SUGGESTION_SERVICE \
    VITE_DMS_APP_ID=$VITE_DMS_APP_ID \
    VITE_DMS_APP_SECRET=$VITE_DMS_APP_SECRET \
    VITE_SNOWFLAKE_API_URL=$VITE_SNOWFLAKE_API_URL \
    VITE_SNOWFLAKE_TOKEN=$VITE_SNOWFLAKE_TOKEN

COPY . .
RUN npm run build

# Tahap 2: Serve dengan Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Pastikan worker nginx bisa baca static files
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
