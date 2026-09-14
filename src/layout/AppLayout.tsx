import { useMemo } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { PageLoadGateProvider } from "../context/PageLoadGateContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import PageLoadOverlay from "../components/common/PageLoadOverlay";
import { usePersistAuthStore } from "../API/store/AuthStore/PersistAuthStore";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const user = usePersistAuthStore((state) => state.user);
  const userRole = user?.role?.name;

  const sidebarMargin = useMemo(() => {
    // 1. Jika role adalah GATE, jangan beri margin sama sekali (Full Width)
    if (userRole === "GATE") return "ml-0";

    // 2. Logika normal untuk role lainnya
    if (isMobileOpen) return "ml-0";
    return isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  }, [isExpanded, isHovered, isMobileOpen, userRole]);

  return (
    <div className="min-h-screen xl:flex transition-all duration-300 ease-in-out bg-gray-50">
      {/* Sidebar + Backdrop hanya di-render jika bukan GATE */}
      {userRole !== "GATE" && (
        <div className="z-40">
          <AppSidebar />
          <Backdrop />
        </div>
      )}

      {/* Main Content — flex-col: header tetap pendek, main yang mengisi sisa tinggi */}
      <div
        className={`
          relative flex min-h-screen flex-1 flex-col overflow-x-hidden
          transition-all duration-300 ease-in-out
          ${sidebarMargin}
        `}
      >
        <AppHeader />
        <main
          className={`relative mx-auto w-full min-h-0 flex-1 p-4 md:p-6 ${userRole === "GATE" ? "max-w-full" : "max-w-screen-2xl"}`}
        >
          {/* Overlay global — tidak perlu setting per halaman */}
          <PageLoadOverlay />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <SidebarProvider>
    <PageLoadGateProvider>
      <LayoutContent />
    </PageLoadGateProvider>
  </SidebarProvider>
);

export default AppLayout;
