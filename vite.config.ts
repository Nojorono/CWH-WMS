import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
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
      host: '127.0.0.1',  // Allow access from all hosts
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
      chunkSizeWarningLimit: 2500,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-dom")) return "react-vendor";
              if (id.includes("react/") || id.includes("react\\")) return "react-vendor";
              
              if (id.includes("zustand")) return "zustand";
              
              if (id.includes("axios")) return "axios";
              
              if (id.includes("react-router")) return "router";
              
              if (id.includes("apexcharts")) return "charts";
              
              if (id.includes("react-data-table-component") || id.includes("datatables.net")) return "datatable";
              
              return "vendor";
            }
          },
        },
      },
    },
  };
});