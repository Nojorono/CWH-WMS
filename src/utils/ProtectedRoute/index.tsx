import { JSX, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import ActIndicator from "../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // 1. Ambil data menu dan status hidrasi langsung dari store baru
  const userMenus = usePersistAuthStore((state) => state.menus);
  const _hasHydrated = usePersistAuthStore((state) => state._hasHydrated);
  const accessToken = usePersistAuthStore((state) => state.accessToken);

  // 2. Extract semua path yang diizinkan (Flatten nested menus)
  const allowedPaths = useMemo(() => {
    if (!userMenus) return [];
    
    const paths: string[] = [];
    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) paths.push(item.path);
        if (item.children?.length) traverse(item.children);
      });
    };
    
    traverse(userMenus);
    return paths;
  }, [userMenus]);

  // 3. Cek apakah user memiliki akses ke path saat ini
  const hasAccess = useMemo(() => {
    // Selalu izinkan akses ke dashboard sebagai fallback dasar jika terdaftar
    if (currentPath === "/dashboard") return true;

    return allowedPaths.some(
      (path) => currentPath === path || currentPath.startsWith(path + "/")
    );
  }, [allowedPaths, currentPath]);

  // Jembatan pengaman jika user mengakses halaman signin secara manual
  if (currentPath === "/signin") return children;

  // 4. GUARD: Tunggu hingga Zustand selesai membaca & men-dekripsi data dari storage
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <ActIndicator />
      </div>
    );
  }

  // 5. Jika proses hidrasi selesai tapi token tidak ada, tendang ke /signin
  if (!accessToken) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // 6. Jika user tidak memiliki akses tetapi ada menu lain yang tersedia, belokkan ke menu pertama
  if (!hasAccess && allowedPaths.length > 0) {
    return <Navigate to={allowedPaths[0]} replace />;
  }

  // 7. Jika benar-benar tidak memiliki akses sama sekali (menu kosong)
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
        <p className="text-gray-500">Anda tidak memiliki izin/akses untuk melihat halaman ini.</p>
      </div>
    );
  }

  return children;
}