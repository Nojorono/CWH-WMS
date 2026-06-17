// import { useMemo } from "react";

// export type GroupedPermission = {
//   menu_id: number;
//   permissions: string[];
// };

// export const usePermission = () => {
//   const groupedPermissions: GroupedPermission[] = useMemo(() => {

//     if (!storedUserLogin || storedUserLogin === "undefined") {
//       console.warn("No user_login_data found in localStorage.");
//       return [];
//     }

//     try {
//       const dataUserLogin = JSON.parse(storedUserLogin);

//       const menus: {
//         id: number;
//         actions: string[];
//       }[] = dataUserLogin?.menus || [];

//       return menus.reduce((acc: GroupedPermission[], menu) => {
//         const existing = acc.find((item) => item.menu_id === menu.id);
//         if (existing) {
//           existing.permissions = Array.from(
//             new Set([...existing.permissions, ...menu.actions])
//           );
//         } else {
//           acc.push({
//             menu_id: menu.id,
//             permissions: menu.actions || [],
//           });
//         }
//         return acc;
//       }, []);
//     } catch (err) {
//       console.warn("Failed to parse user_login_data in usePermission", err);
//       return [];
//     }
//   }, []);

//   const hasPermission = useMemo(() => {
//     return (menuId: number, permissionType: string): boolean => {
//       if (
//         groupedPermissions.some(
//           (perm) => perm.menu_id === -1 && perm.permissions.includes("Manage")
//         )
//       ) {
//         return true;
//       }

//       const found = groupedPermissions.find((perm) => perm.menu_id === menuId);

//       return (
//         !!found &&
//         (found.permissions.includes("Manage") ||
//           found.permissions.includes(permissionType))
//       );
//     };
//   }, [groupedPermissions]);

//   return { hasPermission, permissions: groupedPermissions };
// };



import { useMemo } from "react";
import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";

export type GroupedPermission = {
  menu_id: number;
  permissions: string[];
};

export const usePermission = () => {
  // 1. KUNCI PERBAIKAN: Ambil data menus langsung secara reaktif dari Zustand Store
  const menus = usePersistAuthStore((state) => state.menus) || [];

  // 2. Kelompokkan permission/actions berdasarkan menu_id
  const groupedPermissions: GroupedPermission[] = useMemo(() => {
    if (!menus.length) return [];

    return menus.reduce((acc: GroupedPermission[], menu) => {
      // API Anda mengembalikan menu.id dan menu.actions (berupa array string)
      const existing = acc.find((item) => item.menu_id === menu.id);
      
      if (existing) {
        existing.permissions = Array.from(
          new Set([...existing.permissions, ...(menu.actions || [])])
        );
      } else {
        acc.push({
          menu_id: menu.id,
          permissions: menu.actions || [],
        });
      }
      return acc;
    }, []);
  }, [menus]); // dependensi otomatis berubah jika data menus di store ter-update

  // 3. Fungsi Validator Hak Akses Komponen UI (misal: tombol edit, delete, view)
  const hasPermission = useMemo(() => {
    return (menuId: number, permissionType: string): boolean => {
      // Fitur Global Admin Fallback (jika ada menu_id -1 dengan role Manage)
      if (
        groupedPermissions.some(
          (perm) => perm.menu_id === -1 && perm.permissions.includes("Manage")
        )
      ) {
        return true;
      }

      const found = groupedPermissions.find((perm) => perm.menu_id === menuId);

      return (
        !!found &&
        (found.permissions.includes("Manage") ||
          found.permissions.includes(permissionType))
      );
    };
  }, [groupedPermissions]);

  return { hasPermission, permissions: groupedPermissions };
};