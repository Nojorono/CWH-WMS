import { JSX, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ActIndicator from "../../components/ui/activityIndicator";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Ambil menu dari localStorage
  const menusLocalStorage = localStorage.getItem("menus");
  const menusToUse = useMemo(() => {
    if (menusLocalStorage) {
      try {
        return JSON.parse(menusLocalStorage);
      } catch {
        return [];
      }
    }
    return [];
  }, [menusLocalStorage]);

  // Flatten all accessible paths
  const allowedPaths = useMemo(() => {
    const paths: string[] = [];
    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) paths.push(item.path);
        if (item.children?.length) traverse(item.children);
      });
    };
    traverse(menusToUse || []);
    return paths;
  }, [menusToUse]);

  const hasAccess = useMemo(() => {
    return allowedPaths.some(
      (path) => currentPath === path || currentPath.startsWith(path + "/")
    );
  }, [allowedPaths, currentPath]);

  // Allow akses bebas ke halaman /signin
  if (currentPath === "/signin") return children;

  // Loader jika belum ada menu di localStorage
  if (!menusLocalStorage) {
    return (
      <div className="text-center mt-10 text-blue-500 font-medium">
        <ActIndicator />
      </div>
    );
  }

  // Jika user tidak punya akses ke route ini
  if (!hasAccess) {
    return (
      <div className="text-center mt-10 text-red-600 font-bold">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return children;
}



// import { JSX, useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import { useStoreMenu } from "../../DynamicAPI/stores/Store/MasterStore";
// import ActIndicator from "../../components/ui/activityIndicator";

// interface ProtectedRouteProps {
//   children: JSX.Element;
// }

// export function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const { list: listMenu, fetchAll: fetchMenu } = useStoreMenu();
//   const location = useLocation();
//   const currentPath = location.pathname;

//   const [localMenus, setLocalMenus] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   // ✅ Ambil menu dari API atau LocalStorage
//   useEffect(() => {
//     const fetchMenus = async () => {
//       try {
//         await fetchMenu(); // coba ambil dari API
//       } catch (error) {
//         console.warn("Gagal fetch menu dari API, ambil dari localStorage...");
//         const stored = localStorage.getItem("menus");
//         if (stored) {
//           setLocalMenus(JSON.parse(stored));
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchMenus();
//   }, [fetchMenu]);

//   // ✅ Tentukan sumber data menu: API atau localStorage
//   const menusToUse = useMemo(() => {
//     if (listMenu && listMenu.length > 0) {
//       // Simpan hasil terbaru ke localStorage untuk backup
//       localStorage.setItem("menus", JSON.stringify(listMenu));
//       return listMenu;
//     }
//     return localMenus || [];
//   }, [listMenu, localMenus]);

//   // ✅ Flatten all accessible paths
//   const allowedPaths = useMemo(() => {
//     const paths: string[] = [];

//     const traverse = (items: any[]) => {
//       items.forEach((item) => {
//         if (item.path) paths.push(item.path);
//         if (item.children?.length) traverse(item.children);
//       });
//     };

//     traverse(menusToUse || []);
//     return paths;
//   }, [menusToUse]);

//   const hasAccess = useMemo(() => {
//     return allowedPaths.some(
//       (path) => currentPath === path || currentPath.startsWith(path + "/")
//     );
//   }, [allowedPaths, currentPath]);

//   // ✅ Allow akses bebas ke halaman /signin
//   if (currentPath === "/signin") return children;

//   // ✅ Loader jika masih fetching / mencoba ambil localStorage
//   if (isLoading) {
//     return (
//       <div className="text-center mt-10 text-blue-500 font-medium">
//         <ActIndicator />
//       </div>
//     );
//   }

//   const menusLocalStorage = localStorage.getItem("menus");
//   console.log("menusLocalStorage:", menusLocalStorage);

//   // ✅ Jika user tidak punya akses ke route ini
//   if (!hasAccess) {
//     return (
//       <div className="text-center mt-10 text-red-600 font-bold">
//         Anda tidak memiliki akses ke halaman ini.
//       </div>
//     );
//   }

//   return children;
// }
