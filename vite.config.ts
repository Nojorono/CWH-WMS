import { defineConfig, loadEnv } from "vite";
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
      // splitVendorChunkPlugin is deprecated in Vite 6+
      // Vite now handles vendor chunking automatically, and we have manual chunks defined below
    ],

    server: {
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
      chunkSizeWarningLimit: 2500, // naikkan sedikit biar warning gak muncul
      sourcemap: false, // bisa true kalau mau debug bundle
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Fix: More careful chunking to avoid circular dependency issues
            if (id.includes("node_modules")) {
              // React and React DOM must be together
              if (id.includes("react-dom")) return "react-vendor";
              if (id.includes("react/") || id.includes("react\\")) return "react-vendor";
              
              // Zustand
              if (id.includes("zustand")) return "zustand";
              
              // Axios
              if (id.includes("axios")) return "axios";
              
              // Router (keep together)
              if (id.includes("react-router")) return "router";
              
              // Charts
              if (id.includes("apexcharts")) return "charts";
              
              // Data tables
              if (id.includes("react-data-table-component") || id.includes("datatables.net")) return "datatable";
              
              // Everything else goes to vendor
              return "vendor";
            }
          },
        },
      },
    },
  };
});
