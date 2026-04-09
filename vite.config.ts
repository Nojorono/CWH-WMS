// import { defineConfig, splitVendorChunkPlugin } from "vite";
// import react from "@vitejs/plugin-react";
// import svgr from "vite-plugin-svgr";

// export default defineConfig({
//   plugins: [
//     react(),
//     svgr({
//       svgrOptions: {
//         icon: true,
//         exportType: "named",
//         namedExport: "ReactComponent",
//       },
//     }),
//     // otomatis pisahkan vendor besar
//     splitVendorChunkPlugin(),
//   ],

//   server: {
//     open: "/signin",
//     proxy: {
//       "/api": {
//         target: "http://10.0.29.49:9000",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },

//   build: {
//     cssMinify: "lightningcss",
//     chunkSizeWarningLimit: 2500, // naikkan sedikit biar warning gak muncul
//     sourcemap: false, // bisa true kalau mau debug bundle
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (id.includes("node_modules")) {
//             if (id.includes("react")) return "react-vendor";
//             if (id.includes("zustand")) return "zustand";
//             if (id.includes("axios")) return "axios";
//             if (id.includes("react-router-dom")) return "router";
//             if (id.includes("apexcharts")) return "charts";
//             if (id.includes("react-data-table-component")) return "datatable";
//             return "vendor";
//           }
//         },
//       },
//     },
//   },
// });


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
    chunkSizeWarningLimit: 2500,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "router": ["react-router-dom"],
          "zustand": ["zustand"],
          "axios": ["axios"],
          "charts": ["apexcharts", "react-apexcharts"],
          // react-data-table-component dihapus
        },
      },
    },
  },
});