// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// type SidebarContextType = {
//   isExpanded: boolean;
//   isMobileOpen: boolean;
//   isHovered: boolean;
//   activeItem: string | null;
//   openSubmenu: string | null;
//   toggleSidebar: () => void;
//   toggleMobileSidebar: () => void;
//   closeMobileSidebar: () => void;
//   setIsHovered: (isHovered: boolean) => void;
//   setActiveItem: (item: string | null) => void;
//   toggleSubmenu: (item: string) => void;
// };

// const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// export const useSidebar = () => {
//   const context = useContext(SidebarContext);
//   if (!context) {
//     throw new Error("useSidebar must be used within a SidebarProvider");
//   }
//   return context;
// };

// export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [isExpanded, setIsExpanded] = useState(true);
//   const [isMobileOpen, setIsMobileOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);
//   const [activeItem, setActiveItem] = useState<string | null>(null);
//   const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       if (!mobile) {
//         setIsMobileOpen(false);
//       }
//     };

//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const toggleSidebar = useCallback(() => {
//     setIsExpanded((prev) => !prev);
//   }, []);

//   const toggleMobileSidebar = useCallback(() => {
//     setIsMobileOpen((prev) => !prev);
//   }, []);

//   const closeMobileSidebar = useCallback(() => {
//     setIsMobileOpen(false);
//   }, []);

//   const toggleSubmenu = useCallback((item: string) => {
//     setOpenSubmenu((prev) => (prev === item ? null : item));
//   }, []);

//   return (
//     <SidebarContext.Provider
//       value={{
//         isExpanded: isMobile ? false : isExpanded,
//         isMobileOpen,
//         isHovered,
//         activeItem,
//         openSubmenu,
//         toggleSidebar,
//         toggleMobileSidebar,
//         closeMobileSidebar,
//         setIsHovered,
//         setActiveItem,
//         toggleSubmenu,
//       }}
//     >
//       {children}
//     </SidebarContext.Provider>
//   );
// };

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile((prev) => {
          if (prev !== mobile) {
            if (!mobile) setIsMobileOpen(false);
            return mobile;
          }
          return prev;
        });
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleSubmenu = useCallback((item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  }, []);

  // Membungkus provider value agar referensi objek tidak berubah-ubah tanpa sebab
  const value = useMemo(
    () => ({
      isExpanded: isMobile ? false : isExpanded,
      isMobileOpen,
      isHovered,
      activeItem,
      openSubmenu,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
      setIsHovered,
      setActiveItem,
      toggleSubmenu,
    }),
    [
      isMobile,
      isExpanded,
      isMobileOpen,
      isHovered,
      activeItem,
      openSubmenu,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
      toggleSubmenu,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
