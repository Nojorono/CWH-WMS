import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { usePageLoadGate } from "../context/PageLoadGateContext";
import { useDynamicSidebarItems } from "./useDynamicSidebarItems";
import { usePersistAuthStore } from "../API/store/AuthStore/PersistAuthStore";

/** Trailing debounce: klik cepat hanya navigate ke path terakhir */
const NAV_DEBOUNCE_MS = 220;

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { isPageLoading, beginNavigation } = usePageLoadGate();
  const { menuItems, settingsItems } = useDynamicSidebarItems();

  const user = usePersistAuthStore((state) => state.user);
  const userRole = user?.role?.name;

  const [openMainSubmenu, setOpenMainSubmenu] = useState<number | null>(null);
  const [openSettingsSubmenu, setOpenSettingsSubmenu] = useState<number | null>(
    null,
  );
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const lastNavAtRef = useRef(0);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  const sortedMenuItems = useMemo(() => {
    return [...menuItems].sort((a, b) => {
      const isReportingA = a.path === "/reporting";
      const isReportingB = b.path === "/reporting";

      if (isReportingA && !isReportingB) return 1;
      if (!isReportingA && isReportingB) return -1;
      if (!a.subItems && b.subItems) return -1;
      if (a.subItems && !b.subItems) return 1;
      return 0;
    });
  }, [menuItems]);

  const sortedSettingsItems = useMemo(() => {
    return [...settingsItems].sort((a, b) => {
      if (!a.subItems && b.subItems) return -1;
      if (a.subItems && !b.subItems) return 1;
      return 0;
    });
  }, [settingsItems]);

  /** Setelah pilih menu: tutup submenu agar minim over-klik cepat */
  const closeAllSubmenus = useCallback(() => {
    setOpenMainSubmenu(null);
    setOpenSettingsSubmenu(null);
    setIsHovered(false);
    closeMobileSidebar();
  }, [closeMobileSidebar, setIsHovered]);

  const goToPath = useCallback(
    (path: string) => {
      if (!path || path === location.pathname) return;
      beginNavigation(path);
      lastNavAtRef.current = Date.now();
      navigate(path);
    },
    [beginNavigation, location.pathname, navigate],
  );

  const handleNavClick = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      if (isPageLoading) return;

      closeAllSubmenus();
      if (!path) return;

      const now = Date.now();
      const rapid = now - lastNavAtRef.current < NAV_DEBOUNCE_MS;
      pendingPathRef.current = path;
      if (navTimerRef.current) clearTimeout(navTimerRef.current);

      // Klik tunggal (tenang): navigate langsung. Klik cepat: tunggu path terakhir.
      if (!rapid && path !== location.pathname) {
        pendingPathRef.current = null;
        goToPath(path);
        return;
      }

      navTimerRef.current = setTimeout(() => {
        const to = pendingPathRef.current;
        pendingPathRef.current = null;
        navTimerRef.current = null;
        if (to) goToPath(to);
      }, NAV_DEBOUNCE_MS);
    },
    [closeAllSubmenus, goToPath, isPageLoading, location.pathname],
  );

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  useEffect(() => {
    const refs = [
      ...(openMainSubmenu !== null ? [`main-${openMainSubmenu}`] : []),
      ...(openSettingsSubmenu !== null
        ? [`settings-${openSettingsSubmenu}`]
        : []),
    ];

    refs.forEach((key) => {
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: el.scrollHeight,
        }));
      }
    });
  }, [openMainSubmenu, openSettingsSubmenu]);

  const handleSubmenuToggle = (type: "main" | "settings", index: number) => {
    if (isPageLoading) return;
    if (type === "main") {
      setOpenMainSubmenu((prev) => (prev === index ? null : index));
      setOpenSettingsSubmenu(null);
    } else {
      setOpenSettingsSubmenu((prev) => (prev === index ? null : index));
      setOpenMainSubmenu(null);
    }
  };

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const renderSection = (
    items: typeof menuItems,
    type: "main" | "settings",
    title: string,
  ) => (
    <div>
      <h2
        className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
          !showLabels ? "lg:justify-center" : "justify-start"
        }`}
      >
        {showLabels ? title : <HorizontaLDots className="size-6" />}
      </h2>
      <ul
        className={`flex flex-col gap-4 ${isPageLoading ? "pointer-events-none opacity-45" : ""}`}
      >
        {items.map((nav, index) => {
          const isOpen =
            type === "main"
              ? openMainSubmenu === index
              : openSettingsSubmenu === index;
          const key = `${type}-${index}`;
          return (
            <li key={nav.name}>
              {nav.subItems ? (
                <button
                  type="button"
                  disabled={isPageLoading}
                  onClick={() => handleSubmenuToggle(type, index)}
                  className={`menu-item group ${isOpen ? "menu-item-active" : "menu-item-inactive"} ${
                    !showLabels ? "lg:justify-center" : "lg:justify-start"
                  } ${isPageLoading ? "cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`menu-item-icon-size ${isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
                  >
                    {nav.icon}
                  </span>
                  {showLabels && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                  {showLabels && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    aria-disabled={isPageLoading}
                    tabIndex={isPageLoading ? -1 : undefined}
                    onClick={(e) => handleNavClick(e, nav.path!)}
                    className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"} ${isPageLoading ? "cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
                    >
                      {nav.icon}
                    </span>
                    {showLabels && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )
              )}
              {nav.subItems && showLabels && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[key] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: isOpen ? `${subMenuHeight[key] || 0}px` : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((sub) => (
                      <li key={sub.name}>
                        <Link
                          to={sub.path}
                          aria-disabled={isPageLoading}
                          tabIndex={isPageLoading ? -1 : undefined}
                          onClick={(e) => handleNavClick(e, sub.path)}
                          className={`menu-dropdown-item ${isActive(sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"} ${isPageLoading ? "cursor-not-allowed" : ""}`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      className={`${
        userRole === "GATE" ? "hidden" : "fixed"
      } mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!showLabels ? "lg:justify-center" : "justify-start"}`}
      >
        <Link to="" className={isPageLoading ? "pointer-events-none" : ""}>
          {showLabels ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo_nna.png"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Activity indicator saat halaman dimuat */}
      {isPageLoading && (
        <div
          className={`mb-4 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-2.5 text-slate-700 backdrop-blur-md shadow-sm transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-200 ${
            !showLabels ? "justify-center px-2.5" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {/* Spinner minimalis dua warna */}
          <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
            <span className="absolute h-full w-full rounded-full border-2 border-slate-200 dark:border-slate-700" />
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white dark:border-t-transparent" />
          </div>

          {showLabels && (
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-slate-600 dark:text-slate-300">
                Loading...
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col justify-between flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6 flex flex-col flex-grow">
          <div className="flex flex-col gap-8 flex-grow">
            {renderSection(sortedMenuItems, "main", "Menu")}
          </div>
          {settingsItems.length > 0 && (
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
              {renderSection(sortedSettingsItems, "settings", "Settings")}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
