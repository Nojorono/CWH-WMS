import { useMemo } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
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

      {/* Main Content */}
      <div
        className={`
          flex-1 overflow-x-hidden
          transition-all duration-300 ease-in-out 
          ${sidebarMargin}
        `}
      >
        <AppHeader />
        {/* Atur padding atau max-width jika ingin benar-benar mentok ke pinggir layar */}
        <main
          className={`p-4 mx-auto md:p-6 ${userRole === "GATE" ? "max-w-full" : "max-w-screen-2xl"}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayout;
