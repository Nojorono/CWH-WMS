import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // Get API endpoint from environment variable or use default
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
      host: '0.0.0.0',  // Allow access from all hosts
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