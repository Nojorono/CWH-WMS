import { JSX, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
  MasterUserManagement,
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
  OutboundDO,
  CreateDO,
  DetailDO,
  PickingSuggestion,
  MasterAMO,
  MasterSubdist,
  ApprovalSetup,
  CreateApproval,
  ApprovalProcess,
  PickingTransaction,
} from "./utils/PagesComponent";

const DefaultPage = () => <> </>;

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil token dari store atau localStorage
  const token =
    useAuthStore((state) => state.accessToken) ||
    localStorage.getItem("accessToken");

  // Ambil user menus dari store atau localStorage
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

  // Cek authenticated
  const isAuthenticated = () => {
    if (token) {
      localStorage.setItem("accessToken", token); // Keep token sync
      return true;
    }
    return false;
  };

  // **Redirect jika user sudah login dan buka halaman /signin secara manual**
  useEffect(() => {
    if (isAuthenticated() && location.pathname === "/signin") {
      // Redirect ke halaman pertama menu yang bisa diakses
      navigate(getFirstAccessiblePath(userMenus), { replace: true });
    }
  }, [location.pathname, isAuthenticated, navigate, userMenus]);

  // Jika tidak authenticated, langsung sign out
  useEffect(() => {
    // Jangan auto-signout kalau user sedang di halaman login
    if (!isAuthenticated() && location.pathname !== "/signin") {
      signOut(navigate);
    }
  }, [navigate, location.pathname]);

  // Manual routes untuk child routes yang tidak otomatis dari userMenus
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
    "/outbound_do": [
      { path: "process", element: <CreateDO /> },
      { path: "detail", element: <DetailDO /> },
      { path: "picking_suggestion", element: <PickingSuggestion /> },
      { path: "picking_transaction", element: <PickingTransaction /> },
    ],
    "/approval": [
      { path: "create", element: <CreateApproval /> },
      { path: "process", element: <ApprovalProcess /> },
    ],
  };

  // Map path ke komponen
  const getElementByPath = (path: string): JSX.Element => {
    const map: Record<string, JSX.Element> = {
      "/master_user": <MasterUser />,
      "/master_user_management": <MasterUserManagement />,
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
      "/outbound_do": <OutboundDO />,
      "/master_amo": <MasterAMO />,
      "/master_subdist": <MasterSubdist />,
      "/approval_setup": <ApprovalSetup />,
    };
    return map[path] || <DefaultPage />;
  };

  // Buat array route dari userMenus dan manual child routes
  const userRoutes = useMemo(() => {
    const routes: { id: string; path: string; element: JSX.Element }[] = [];

    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) {
          const element = getElementByPath(item.path);
          if (element) {
            routes.push({
              id: item.id || item.path,
              path: item.path,
              element,
            });
          }

          // Tambah child routes jika ada
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

          // Rekursif ke anak-anak menu
          if (item.children?.length) {
            traverse(item.children);
          }
        }
      });
    };

    traverse(userMenus);
    return routes;
  }, [userMenus]);

  // Ambil path pertama yang accessible untuk redirect default setelah login
  const getFirstAccessiblePath = (menus: any[]): string => {
    const findChildPath = (list: any[]): string | null => {
      for (const item of list) {
        if (item.children && item.children.length > 0) {
          const childPath = findChildPath(item.children);
          if (childPath) return childPath;
        }
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
        {/* Routes untuk guest (belum login) */}
        {!isAuthenticated() && (
          <>
            <Route path="/signin" element={<SignIn />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </>
        )}

        {/* Routes untuk user sudah login */}
        {isAuthenticated() && (
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <Navigate to={getFirstAccessiblePath(userMenus)} replace />
              }
            />
            {userRoutes.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<ProtectedRoute>{route.element}</ProtectedRoute>}
              />
            ))}
            <Route path="*" element={<></>} />
          </Route>
        )}
      </Routes>
    </>
  );
}
