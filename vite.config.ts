import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiEndpoint = env.VITE_API_ENDPOINT || "https://api.kcsi.id/service-wms";

  return {
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
      host: "127.0.0.1",
      port: 5173,
      strictPort: false,
      open: "/signin",
      proxy: {
        "/api": {
          target: apiEndpoint,
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
  };
});