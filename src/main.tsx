import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { getServerDatetime } from "./API/services/DOsuggestionServices/dateTimeServer.ts";
import { syncServerTime } from "./pages/DOsuggestion/Suggestion/global/allowedDate.ts";

const queryClient = new QueryClient();

if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
}

// Bungkus proses render dalam fungsi async agar bisa menunggu API waktu
const startApp = async () => {
  try {
    // 1. Ambil waktu server SEBELUM aplikasi dirender
    const response = await getServerDatetime();

    // 2. Sync ke dateValidation.ts
    if (response?.data?.timestamp) {
      syncServerTime(response.data.timestamp);
    }
  } catch (error) {
    console.error(
      "Gagal sinkronisasi waktu server, menggunakan waktu lokal:",
      error,
    );
  }

  // 3. Render aplikasi setelah sync selesai
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppWrapper>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
};

// Jalankan fungsi bootstrap
startApp();
