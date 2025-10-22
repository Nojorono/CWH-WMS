import { useMemo } from "react";
import * as Icons from "react-icons/fa";

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
  icon: string;
  id: string | number;
  name: string;
  path?: string;
  order: number;
  parentId: string | null;
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

const resolveIcon = (iconName: string): React.ReactNode => {
  const cleanIconName = iconName?.trim().replace(/\u200B/g, "");
  const IconComponent = Icons[cleanIconName as keyof typeof Icons];
  // if (!IconComponent) console.warn(`Icon not found: ${cleanIconName}`);
  return IconComponent ? <IconComponent /> : <Icons.FaFile />;
};

const buildMenuHierarchy = (menuItems: MenuItem[]): MenuItem[] => {
  const menuMap: Record<string | number, MenuItem> = {};
  menuItems.forEach((menu) => {
    menuMap[menu.id] = { ...menu, children: [] };
  });

  const roots: MenuItem[] = [];
  menuItems.forEach((menu) => {
    if (menu.parentId) {
      const parent = menuMap[menu.parentId];
      if (parent) parent.children?.push(menuMap[menu.id]);
    } else {
      roots.push(menuMap[menu.id]);
    }
  });

  return roots;
};

const getParsedLocalStorage = (key: string): any => {
  const value = localStorage.getItem(key);
  try {
    return value && value !== "undefined" ? JSON.parse(value) : null;
  } catch {
    console.warn(`Failed to parse localStorage for key: ${key}`);
    return null;
  }
};

// =====================
// Main Hook
// =====================

export const useDynamicSidebarItems = (): SidebarItems => {
  const localMenus: MenuItem[] = useMemo(() => {
    return getParsedLocalStorage("local_menus") ?? [];
  }, []);

  const userLoginMenus: MenuItem[] | null = useMemo(() => {
    const userData = getParsedLocalStorage("user_login_data");
    return userData?.menus ?? null;
  }, []);

  const { menuItems, settingsItems } = useMemo(() => {
    const effectiveMenus = userLoginMenus?.length ? userLoginMenus : localMenus;
    if (!effectiveMenus || effectiveMenus.length === 0) {
      return { menuItems: [], settingsItems: [] };
    }

    const hierarchy = buildMenuHierarchy(effectiveMenus);
    const menuItems: NavItem[] = [];
    const settingsItems: NavItem[] = [];

    hierarchy.forEach((parent) => {
      const baseItem: NavItem = {
        name: formatName(parent.name),
        icon: resolveIcon(parent.icon),
        path: parent.path || "",
      };

      if (parent.children?.length) {
        baseItem.subItems = parent.children
          .sort((a, b) => a.order - b.order) // ✅ urut anak berdasarkan order
          .map((child) => ({
            name: formatName(child.name),
            path: child.path || "",
          }));
      }

      // Pisahkan ke Settings section jika path === "/settings"
      if (parent.path === "/settings") {
        settingsItems.push({ ...baseItem, order: parent.order } as any);
      } else {
        menuItems.push({ ...baseItem, order: parent.order } as any);
      }
    });

    // ✅ Urutkan berdasarkan kolom order dari backend
    const sortByOrder = (a: any, b: any) => a.order - b.order;

    return {
      menuItems: menuItems.sort(sortByOrder),
      settingsItems: settingsItems.sort(sortByOrder),
    };
  }, [localMenus, userLoginMenus]);

  return { menuItems, settingsItems };
};
