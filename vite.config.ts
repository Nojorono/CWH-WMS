import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const dmsAppId = env.VITE_DMS_APP_ID || "dms-gen3-wms";
  const dmsAppSecret =
    env.VITE_DMS_APP_SECRET ||
    "AElodThMJubzV8mL9et0j8bU27r7sEwGvequLIbeVN5YqDRo";
  const dmsTarget =
    env.VITE_DO_SUGGESTION_SERVICE || "https://staging-api.nna-id.com";

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
      open: "/signin",
      host: true,
      proxy: {
        // DMS/BTB staging — inject header di sini (bukan andalkan forward dari browser)
        "/nna-api": {
          target: dmsTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/nna-api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              proxyReq.setHeader("x-dms-app-id", dmsAppId);
              proxyReq.setHeader("x-dms-app-secret", dmsAppSecret);
              proxyReq.setHeader("Accept", "application/json");
              proxyReq.setHeader("Content-Type", "application/json");

              // Debug: pastikan header ikut ke staging
              console.log(
                "[nna-api proxy]",
                req.method,
                proxyReq.path,
                "| x-dms-app-id=",
                dmsAppId,
              );
            });
          },
        },
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
            router: ["react-router-dom"],
            zustand: ["zustand"],
            axios: ["axios"],
            charts: ["apexcharts", "react-apexcharts"],
          },
        },
      },
    },
  };
});
