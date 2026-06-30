import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// 1. Import QueryClient dan QueryClientProvider
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

// 2. Buat instance QueryClient di luar render
const queryClient = new QueryClient();

if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 3. Bungkus aplikasi dengan QueryClientProvider */}
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
