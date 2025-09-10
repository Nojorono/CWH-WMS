import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    open: '/signin',
    proxy: {
      "/api": {
        target: "http://10.0.29.49:9000",
        changeOrigin: true,
        secure: false, // jika backend tidak menggunakan HTTPS
      },
    },
  },
  build: {
    cssMinify: "lightningcss", // lebih toleran ke CSS error bawaan template
    chunkSizeWarningLimit: 2000, // naikkan limit biar warning size hilang
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor: ["axios", "zustand", "react-router-dom"], // pisahkan vendor biar chunk lebih kecil
          charts: ["react-apexcharts", "apexcharts"],
        },
      },
    },
  },
});
