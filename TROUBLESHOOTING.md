# Troubleshooting: Local vs Docker Build Issues

## Masalah: Aplikasi berjalan baik di local tapi error di Docker

### Perbedaan Utama Local vs Docker:

1. **Development vs Production Build**
   - **Local**: `npm run dev` - Development mode dengan Hot Module Replacement (HMR)
   - **Docker**: `npm run build` - Production build yang di-optimize, minify, dan chunk

2. **Build Optimization**
   - Production build lebih agresif dalam:
     - Code minification
     - Tree shaking (menghapus unused code)
     - Code splitting/chunking
     - Dead code elimination

3. **Environment Variables**
   - Local mungkin pakai `.env` file
   - Docker harus set via `--build-arg` atau `ENV`

4. **Dependency Resolution**
   - Node modules bisa berbeda antara local dan Docker
   - Cache behavior berbeda

## Penyebab Error "Cannot access 'Aa' before initialization":

### 1. **Chunking Strategy Issue**
Production build dengan manual chunks bisa menyebabkan circular dependency yang tidak terdeteksi di dev mode.

**Solusi:**
```bash
# Test build lokal untuk simulasi production
npm run build
npm run preview  # Test production build lokal
```

### 2. **React/React-DOM Chunk Separation**
React dan React-DOM harus di chunk yang sama untuk menghindari initialization order issues.

**Sudah diperbaiki di vite.config.ts:**
```typescript
if (id.includes("react-dom")) return "react-vendor";
if (id.includes("react/") || id.includes("react\\")) return "react-vendor";
```

### 3. **Cache Issues**
Docker build cache bisa menyebabkan build yang tidak konsisten.

**Solusi:**
```bash
# Rebuild tanpa cache
docker-compose build --no-cache frontend-wms
```

### 4. **Environment Variables Missing**
Jika build memerlukan env vars yang tidak ter-set.

**Cek:**
```bash
# Pastikan env vars ter-set saat build
docker-compose build \
  --build-arg VITE_API_ENDPOINT="https://api.kcsi.id/service-wms" \
  --build-arg VITE_S3_ENDPOINT="..."
```

## Langkah Troubleshooting:

### Step 1: Test Production Build Lokal
```bash
# Build production di local
npm run build

# Test production build
npm run preview

# Buka browser dan cek console untuk error
```

### Step 2: Enable Sourcemap untuk Debug
Edit `vite.config.ts`:
```typescript
build: {
  sourcemap: true,  // Enable untuk debug
  // ...
}
```

Rebuild dan cek error yang lebih detail di browser console.

### Step 3: Simplify Chunking (Test)
Sementara disable manual chunks untuk test:
```typescript
build: {
  rollupOptions: {
    output: {
      // Comment manualChunks sementara
      // manualChunks(id) { ... }
    },
  },
}
```

### Step 4: Check Docker Build Logs
```bash
# Build dengan verbose output
docker-compose build --progress=plain frontend-wms

# Check build logs untuk warning/error
docker-compose logs frontend-wms
```

### Step 5: Compare Build Output
```bash
# Build lokal
npm run build

# Inspect dist folder
ls -la dist/assets/

# Build di Docker dan compare
docker-compose build frontend-wms
docker run --rm frontend-wms:latest ls -la /usr/share/nginx/html/assets/
```

## Solusi Alternatif:

### Option 1: Disable Aggressive Optimization (Temporary)
```typescript
build: {
  minify: 'esbuild',  // Lebih konservatif dari terser
  terserOptions: {
    compress: {
      drop_console: false,  // Keep console.log untuk debug
    },
  },
}
```

### Option 2: Use Development Build in Docker (Testing Only)
```dockerfile
# Hanya untuk testing - JANGAN untuk production
RUN npm run dev -- --host
```

### Option 3: Match Local Node Version
Pastikan Node version di Docker sama dengan local:
```dockerfile
FROM node:20-alpine  # Match dengan local node version
```

## Checklist:

- [ ] Test production build lokal (`npm run build && npm run preview`)
- [ ] Enable sourcemap untuk debug
- [ ] Rebuild Docker tanpa cache (`--no-cache`)
- [ ] Cek environment variables
- [ ] Compare build output lokal vs Docker
- [ ] Check browser console untuk error detail
- [ ] Verify chunk loading order di Network tab

## Common Fixes:

1. **React chunking fixed** ✅ (sudah di vite.config.ts)
2. **Environment variables** - Pastikan ter-set via build args
3. **Build cache** - Clear dengan `--no-cache`
4. **Sourcemap** - Enable untuk debugging

