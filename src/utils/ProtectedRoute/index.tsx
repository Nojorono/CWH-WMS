import { JSX, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
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

  if (!hasAccess && allowedPaths.length > 0) {
    // Redirect ke halaman pertama yang diizinkan
    return <Navigate to={allowedPaths[0]} replace />;
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