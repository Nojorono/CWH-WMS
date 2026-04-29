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
    open: "/signin",
    host: true,
    proxy: {
      "/api": {
        target: "http://10.0.29.49:9000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    cssMinify: "lightningcss",
    chunkSizeWarningLimit: 5000,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "router": ["react-router-dom"],
          "zustand": ["zustand"],
          "axios": ["axios"],
          "charts": ["apexcharts", "react-apexcharts"],
        },
      },
    },
  },
});