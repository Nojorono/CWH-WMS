import { defineConfig, splitVendorChunkPlugin } from "vite";
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
    // otomatis pisahkan vendor besar
    splitVendorChunkPlugin(),
  ],

  server: {
    host: '0.0.0.0', // Allow external connections (accessible via IP address)
    port: 5173,
    open: "/signin",
    proxy: {
      "/api": {
        target: "http://api.kcsi.id/service-wms",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    cssMinify: "lightningcss",
    chunkSizeWarningLimit: 2500, // naikkan sedikit biar warning gak muncul
    sourcemap: false, // bisa true kalau mau debug bundle
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("zustand")) return "zustand";
            if (id.includes("axios")) return "axios";
            if (id.includes("react-router-dom")) return "router";
            if (id.includes("apexcharts")) return "charts";
            if (id.includes("react-data-table-component")) return "datatable";
            return "vendor";
          }
        },
      },
    },
  },
});
