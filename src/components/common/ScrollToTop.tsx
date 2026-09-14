import { useEffect } from "react";
import { useLocation } from "react-router";
import Swal from "sweetalert2";

/**
 * Tiap ganti route:
 * - scroll ke atas (instant — smooth menumpuk saat klik menu cepat)
 * - bersihkan blocker yang sering bikin UI "freeze" (Swal / flatpickr / body lock)
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    try {
      if (Swal.isVisible()) Swal.close();
    } catch {
      /* ignore */
    }
    document.querySelectorAll(".swal2-container").forEach((el) => el.remove());

    document.querySelectorAll(".flatpickr-calendar").forEach((el) => {
      el.classList.remove("open", "arrowTop", "arrowBottom");
      (el as HTMLElement).style.display = "none";
    });

    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.body.classList.remove(
      "swal2-shown",
      "swal2-height-auto",
      "overflow-hidden",
    );
  }, [pathname]);

  return null;
}
