import { JSX, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import { signOut } from "./utils/SignOut";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { useAuthStore } from "./API/store/AuthStore/authStore";
import { ProtectedRoute } from "./utils/ProtectedRoute";

// Pages...
import {
  MasterMenu,
  MasterPallet,
  MasterUser,
  MasterRole,
  CreateRole,
  UpdateRole,
  Inbound,
  InboundProcess,
  MasterUOM,
  MasterIO,
  MasterWarehouse,
  MasterItem,
  MasterClassification,
  MasterVehicle,
  MasterZone,
  MasterBin,
  MasterSource,
  MasterSupplier,
  Inventory,
  PutAway,
  PutAwayProcess,
  MainTabPallet,
  MainTabZone,
  InventoryDetail,
  Memo,
  MemoProcess,
} from "./utils/PagesComponent";
import NotFound from "./pages/OtherPage/NotFound";

// import dummyRoutes from "./helper/dummyRoutes";

const DefaultPage = () => (
  <div style={{ textAlign: "center", marginTop: "50px" }}>
    {/* <NotFound /> */}
    <></>
  </div>
);

export function AppRoutes() {
  const navigate = useNavigate();
  const token =
    useAuthStore((state) => state.accessToken) ||
    localStorage.getItem("accessToken");

  const localUserMenus = useMemo(() => {
    const stored = localStorage.getItem("user_login_data");
    try {
      return stored && stored !== "undefined"
        ? JSON.parse(stored).menus ?? []
        : [];
    } catch {
      console.warn("Failed to parse user_login_data");
      return [];
    }
  }, []);

  const userMenus = useAuthStore((state) => state.menus) || localUserMenus;

  const isAuthenticated = () => {
    if (token) {
      localStorage.setItem("accessToken", token);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      signOut(navigate);
    }
  }, [navigate]);

  const manualChildRoutes: Record<
    string,
    { path: string; element: JSX.Element }[]
  > = {
    "/master_role": [
      { path: "create", element: <CreateRole /> },
      { path: "update", element: <UpdateRole /> },
    ],
    "/master_pallet": [{ path: "detail", element: <MainTabPallet /> }],
    "/master_zone": [{ path: "detail", element: <MainTabZone /> }],
    "/inbound_planning": [{ path: "process", element: <InboundProcess /> }],
    "/putaway": [{ path: "process", element: <PutAwayProcess /> }],
    "/inventory": [{ path: "detail", element: <InventoryDetail /> }],
    "/memo": [{ path: "process", element: <MemoProcess /> }],
  };

  const getElementByPath = (path: string): JSX.Element | null => {
    const map: Record<string, JSX.Element> = {
      "/master_user": <MasterUser />,
      "/master_menu": <MasterMenu />,
      "/master_role": <MasterRole />,
      "/master_pallet": <MasterPallet />,
      "/inbound_planning": <Inbound />,
      "/putaway": <PutAway />,
      "/master_uom": <MasterUOM />,
      "/master_io": <MasterIO />,
      "/master_warehouse": <MasterWarehouse />,
      "/master_item": <MasterItem />,
      "/master_supplier": <MasterSupplier />,
      "/master_classification": <MasterClassification />,
      "/master_vehicle": <MasterVehicle />,
      "/master_zone": <MasterZone />,
      "/master_bin": <MasterBin />,
      "/master_source": <MasterSource />,
      "/inventory": <Inventory />,
      "/memo": <Memo />,
    };
    return map[path] || <DefaultPage />;
  };

  const userRoutes = useMemo(() => {
    const routes: { id: string; path: string; element: JSX.Element }[] = [];

    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) {
          const Element = getElementByPath(item.path);
          if (Element) {
            routes.push({
              id: item.id || item.path,
              path: item.path,
              element: Element,
            });
          }

          const childRoutes = manualChildRoutes[item.path];
          if (childRoutes) {
            childRoutes.forEach((child) => {
              routes.push({
                id: `${item.path}-${child.path}`,
                path: `${item.path}/${child.path}`,
                element: child.element,
              });
            });
          }

          if (item.children?.length) {
            traverse(item.children);
          }
        }
      });
    };

    traverse(userMenus);
    return routes;
  }, [userMenus]);

  const getFirstAccessiblePath = (menus: any[]): string => {
    // flatten recursive
    const findChildPath = (list: any[]): string | null => {
      for (const item of list) {
        // jika punya anak, cari ke dalam dulu (prioritas menu anakan)
        if (item.children && item.children.length > 0) {
          const childPath = findChildPath(item.children);
          if (childPath) return childPath;
        }
        // jika tidak punya anak dan ada path valid, ini target kita
        if (!item.children?.length && item.path) {
          return item.path;
        }
      }
      return null;
    };

    return findChildPath(menus) || "/";
  };

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Jika belum login, redirect ke /signin */}
        {!isAuthenticated() && (
          <Route path="/" element={<Navigate to="/signin" replace />} />
        )}

        {/* Route login */}
        <Route
          path="/signin"
          element={
            isAuthenticated() ? (
              <Navigate to={getFirstAccessiblePath(userMenus)} replace />
            ) : (
              <SignIn />
            )
          }
        />

        {/* Jika sudah login */}
        {isAuthenticated() && (
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {userRoutes.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<ProtectedRoute>{route.element}</ProtectedRoute>}
              />
            ))}
          </Route>
        )}
      </Routes>
    </>
  );
}
