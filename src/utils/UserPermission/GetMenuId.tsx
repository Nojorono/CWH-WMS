import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";

export const getMenuIdByPath = (path: string): number | null => {
  const menus = usePersistAuthStore.getState().menus;

  if (!Array.isArray(menus)) return null;

  // Lakukan pencarian menu berdasarkan path URL
  const menu = menus.find((m: any) => m.path === path);
  
  return menu ? menu.id : null;
};