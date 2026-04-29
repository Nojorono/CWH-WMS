import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import ACTIVE_ENV from "./utils/ActiveEnv.ts";

if (ACTIVE_ENV !== "dev") {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
}

console.error(`🚀 WMS Running in ${ACTIVE_ENV.toUpperCase()} mode`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
