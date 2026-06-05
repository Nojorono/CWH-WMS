import { useMemo } from "react";
import * as Icons from "react-icons/fa";

// Import global store baru Anda
import { usePersistAuthStore } from "../API/store/AuthStore/PersistAuthStore";

// =====================
// Types
// =====================

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

export type MenuItem = {
  icon: string | null;
  id: string | number;
  name: string;
  path?: string;
  order: number;
  parentId: string | number | null;
  children?: MenuItem[];
};

export type SidebarItems = {
  menuItems: NavItem[];
  settingsItems: NavItem[];
};

// =====================
// Helpers
// =====================

const formatName = (name: string): string =>
  name.replace(/([A-Z])/g, " $1").trim();

const resolveIcon = (iconName: string | null): React.ReactNode => {
  if (!iconName) return <Icons.FaFile />;
  const cleanIconName = iconName.trim().replace(/\u200B/g, "");
  const IconComponent = Icons[cleanIconName as keyof typeof Icons];
  return IconComponent ? <IconComponent /> : <Icons.FaFile />;
};

// Fungsi pembangun hirarki yang disempurnakan agar kebal terhadap string/number id mixing
const buildMenuHierarchy = (menuItems: MenuItem[]): MenuItem[] => {
  const menuMap: Record<string | number, MenuItem> = {};
  
  menuItems.forEach((menu) => {
    menuMap[menu.id] = { ...menu, children: [] };
  });

  const roots: MenuItem[] = [];
  menuItems.forEach((menu) => {
    // Pastikan pembandingan parentId dikonversi secara aman
    if (menu.parentId !== null && menu.parentId !== undefined && menu.parentId !== "") {
      const parent = menuMap[menu.parentId];
      if (parent) {
        parent.children?.push(menuMap[menu.id]);
      } else {
        // Fallback jika parentId ada tapi object parent belum map (bisa dimasukkan ke root)
        roots.push(menuMap[menu.id]);
      }
    } else {
      roots.push(menuMap[menu.id]);
    }
  });

  return roots;
};

// =====================
// Main Hook
// =====================

export const useDynamicSidebarItems = (): SidebarItems => {
  // 1. KUNCI PERBAIKAN: Ambil data langsung dari Zustand Store baru
  const storeMenus = usePersistAuthStore((state) => state.menus) as MenuItem[] | null;

  const { menuItems, settingsItems } = useMemo(() => {
    const effectiveMenus = storeMenus ?? [];
    
    if (effectiveMenus.length === 0) {
      return { menuItems: [], settingsItems: [] };
    }

    // 2. Jalankan fungsi hirarki untuk memisahkan parent dan child menu
    const hierarchy = buildMenuHierarchy(effectiveMenus);
    const generatedMenuItems: NavItem[] = [];
    const generatedSettingsItems: NavItem[] = [];

    hierarchy.forEach((parent) => {
      const baseItem: NavItem = {
        name: parent.name, // Dipertahankan tanpa formatName jika dari API nama menu sudah rapi, atau gunakan formatName(parent.name) jika ingin auto-space
        icon: resolveIcon(parent.icon),
        path: parent.path || "",
      };

      // Jika menu memiliki sub-menu (children hasil buildMenuHierarchy)
      if (parent.children && parent.children.length > 0) {
        baseItem.subItems = parent.children
          .sort((a, b) => a.order - b.order) // Urutkan anak menu berdasarkan order dari API
          .map((child) => ({
            name: child.name,
            path: child.path || "",
          }));
      }

      // Pisahkan ke bagian Settings section jika nama atau path mengandung unsur setting
      if (parent.path === "/settings" || parent.name.toLowerCase().includes("setting")) {
        generatedSettingsItems.push({ ...baseItem, order: parent.order } as any);
      } else {
        generatedMenuItems.push({ ...baseItem, order: parent.order } as any);
      }
    });

    // Urutkan menu utama berdasarkan kolom order backend
    const sortByOrder = (a: any, b: any) => a.order - b.order;

    return {
      menuItems: generatedMenuItems.sort(sortByOrder),
      settingsItems: generatedSettingsItems.sort(sortByOrder),
    };
  }, [storeMenus]);

  return { menuItems, settingsItems };
};