import { JSX, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStoreMenu } from "../../DynamicAPI/stores/Store/MasterStore";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { list: listMenu, fetchAll: fetchMenu } = useStoreMenu();
  const location = useLocation();
  const currentPath = location.pathname;

  // ✅ Fetch menu saat komponen pertama kali render
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // ✅ Flatten all accessible paths
  const allowedPaths = useMemo(() => {
    const paths: string[] = [];

    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) paths.push(item.path);
        if (item.children?.length) traverse(item.children);
      });
    };

    traverse(listMenu || []);
    return paths;
  }, [listMenu]);

  // ✅ Cek apakah user punya akses ke path ini
  const hasAccess = useMemo(() => {
    return allowedPaths.some(
      (path) => currentPath === path || currentPath.startsWith(path + "/")
    );
  }, [allowedPaths, currentPath]);

  // ✅ Allow akses bebas ke halaman /signin (tidak dicek menu)
  if (currentPath === "/signin") {
    return children;
  }

  // ✅ Jika belum ada data menu (masih loading), bisa render loader
  if (!listMenu || listMenu.length === 0) {
    return (
      <div className="text-center mt-10 text-blue-500 font-medium">
        Memuat...
      </div>
    );
  }

  // ✅ Jika user tidak punya akses ke route ini
  if (!hasAccess) {
    return (
      <div className="text-center mt-10 text-red-600 font-bold">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  // ✅ Jika semua aman
  return children;
}



// import { JSX, useMemo } from "react";
// import { useLocation } from "react-router-dom";

// interface ProtectedRouteProps {
//   children: JSX.Element;
// }

// export function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const location = useLocation();
//   const currentPath = location.pathname;

//   // Bypass cek akses untuk route /signin (atau route public lain jika ada)
//   if (currentPath === "/signin") {
//     return children;
//   }

//   // Ambil user menus dari localStorage, memoize
//   const userMenus = useMemo(() => {
//     const stored = localStorage.getItem("user_login_data");
//     try {
//       return stored && stored !== "undefined"
//         ? JSON.parse(stored).menus ?? []
//         : [];
//     } catch {
//       console.warn("Failed to parse user_login_data in ProtectedRoute");
//       return [];
//     }
//   }, []);

//   // Flatten paths dari menu
//   const allowedPaths = useMemo(() => {
//     const paths: string[] = [];
//     const traverse = (items: any[]) => {
//       items.forEach((item) => {
//         if (item.path) paths.push(item.path);
//         if (item.children?.length) traverse(item.children);
//       });
//     };
//     traverse(userMenus);
//     return paths;
//   }, [userMenus]);

//   // Cek akses
//   const hasAccess = useMemo(() => {
//     return allowedPaths.some(
//       (path) => currentPath === path || currentPath.startsWith(path + "/")
//     );
//   }, [allowedPaths, currentPath]);

//   if (!hasAccess) {
//     return (
//       <div className="text-center mt-10 text-red-600 font-bold">
//         Anda tidak memiliki akses ke halaman ini.
//       </div>
//     );
//   }

//   return children;
// }
