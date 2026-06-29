import { JSX, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Layout & Auth
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import { signOut } from "./utils/SignOut";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { ProtectedRoute } from "./utils/ProtectedRoute";

// Store Baru
import { usePersistAuthStore } from "./API/store/AuthStore/PersistAuthStore";

// Pages
import {
  Dashboard,
  MasterMenu,
  MasterPallet,
  MasterUserManagement,
  MasterRole,
  CreateRole,
  UpdateRole,
  Inbound,
  InboundProcess,
  MasterUOM,
  MasterIO,
  MasterWarehouse,
  MainTabWarehouse,
  MasterItem,
  MasterClassification,
  MasterVehicle,
  MasterZone,
  MasterWeek,
  MasterSource,
  MasterSupplier,
  MasterDepartement,
  Inventory,
  PutAway,
  PutAwayProcess,
  MainTabPallet,
  MainTabZone,
  InventoryDetail,
  InventoryOnHand,
  Memo,
  MemoProcess,
  OutboundDO,
  CreateDO,
  DetailDO,
  PickingSuggestion,
  MasterAMO,
  MasterSubdist,
  PickingTransaction,
  DetachAttachProcess,
  GateLoading,
  PrintSuratJalan,
  InventoryVisibility,
  InventoryMovement,
  StockAdjustment,
  ReportInbound,
  ReportOutbound,
  Reporting2,
  MasterBin,
  InboundIntegration,
  IRintegrationLog,
  DOsuggestionMain,
  ShipConfirmLog,
  GenerateDO,
  OutboundSales,
} from "./utils/PagesComponent";
import IntegrationMonitoringPage from "./pages/DOsuggestion/IntegrationLog";

const DefaultPage = () => (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500">
    </p>
  </div>
);

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil state dari PersistAuthStore
  const _hasHydrated = usePersistAuthStore((state) => state._hasHydrated);
  const accessToken = usePersistAuthStore((state) => state.accessToken);
  const userMenus = usePersistAuthStore((state) => state.menus) || [];

  const isAuthenticated = !!accessToken;

  const manualChildRoutes: Record<
    string,
    { path: string; element: JSX.Element }[]
  > = useMemo(
    () => ({
      "/master_role": [
        { path: "create", element: <CreateRole /> },
        { path: "update", element: <UpdateRole /> },
      ],
      "/master_pallet": [{ path: "detail", element: <MainTabPallet /> }],
      "/master_zone": [{ path: "detail", element: <MainTabZone /> }],
      "/master_warehouse": [
        { path: "detail", element: <MainTabWarehouse /> },
        { path: "zone", element: <MainTabZone /> },
      ],
      "/inbound_planning": [{ path: "process", element: <InboundProcess /> }],
      "/putaway": [{ path: "process", element: <PutAwayProcess /> }],
      "/inventory": [{ path: "detail", element: <InventoryDetail /> }],
      "/memo": [{ path: "process", element: <MemoProcess /> }],
      "/outbound_do": [
        { path: "process", element: <CreateDO /> },
        { path: "detail", element: <DetailDO /> },
        { path: "picking_suggestion", element: <PickingSuggestion /> },
        { path: "detach_attach", element: <DetachAttachProcess /> },
        { path: "print_surat_jalan", element: <PrintSuratJalan /> },
      ],
      "/do_suggestion": [{ path: "generate_do", element: <GenerateDO /> }],
    }),
    [],
  );

  // 2. Route Element Mapper (Gunakan function standar agar aman dari hoisted reference)
  function getElementByPath(path: string): JSX.Element {
    const map: Record<string, JSX.Element> = {
      "/dashboard": <Dashboard />,
      "/master_user": <MasterUserManagement />,
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
      "/master_departement": <MasterDepartement />,

      "/master_week": <MasterWeek />,
      "/main_inventory": <Inventory />,
      "/memo": <Memo />,
      "/outbound_do": <OutboundDO />,
      "/master_amo": <MasterAMO />,
      "/master_subdist": <MasterSubdist />,
      "/picking_transaction": <PickingTransaction />,
      "/gate_loading": <GateLoading />,
      "/inventory_visibility": <InventoryVisibility />,
      "/inventory_movement": <InventoryMovement />,
      "/inventory_on_hand": <InventoryOnHand />,
      "/stock_adjustment": <StockAdjustment />,
      "/report_inbound": <ReportInbound />,
      "/report_outbound": <ReportOutbound />,
      "/reporting3": <Reporting2 />,
      "/setup_master_warehouse": <MasterWarehouse />,
      "/inbound_integration_log": <InboundIntegration />,
      "/ir_integration_log": <IRintegrationLog />,
      "/outbound_integration_log": <ShipConfirmLog />,
      "/do_suggestion": <DOsuggestionMain />,
      "/outbound_sales": <OutboundSales />,
      "/do_su_log_integration": <IntegrationMonitoringPage />,


    };
    return map[path] || <DefaultPage />;
  }

  const getFirstAccessiblePath = useMemo(() => {
    const findPath = (menus: any[]): string | null => {
      for (const item of menus) {
        if (item.children?.length) {
          const childPath = findPath(item.children);
          if (childPath) return childPath;
        }
        if (item.path) {
          const element = getElementByPath(item.path);
          if (element.type !== DefaultPage) {
            return item.path;
          }
        }
      }
      return null;
    };
    return findPath(userMenus) || "/dashboard";
  }, [userMenus]);

  const userRoutes = useMemo(() => {
    const routes: { id: string; path: string; element: JSX.Element }[] = [];
    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) {
          const element = getElementByPath(item.path);
          if (element) {
            routes.push({
              id: `route-${item.id || item.path}`,
              path: item.path,
              element,
            });
          }
          const childRoutes = manualChildRoutes[item.path];
          if (childRoutes) {
            childRoutes.forEach((child) => {
              routes.push({
                id: `child-${item.path}-${child.path}`,
                path: `${item.path}/${child.path}`,
                element: child.element,
              });
            });
          }
          if (item.children?.length) traverse(item.children);
        }
      });
    };
    traverse(userMenus);
    return routes;
  }, [userMenus, manualChildRoutes]);

  // ==========================================
  // SIDE EFFECTS & ROUTING LIFE CYCLE
  // ==========================================

  // Effect: Redirect jika sudah login tapi coba akses manual halaman /signin
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && location.pathname === "/signin") {
      navigate(getFirstAccessiblePath, { replace: true });
    }
  }, [
    _hasHydrated,
    isAuthenticated,
    location.pathname,
    navigate,
    getFirstAccessiblePath,
  ]);

  // Effect: Auto Sign Out jika token hilang dari storage
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated && location.pathname !== "/signin") {
      signOut(navigate);
    }
  }, [_hasHydrated, isAuthenticated, location.pathname, navigate]);

  // GUARD: Tunggu sinkronisasi enkripsi data local storage selesai
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Guest Routes */}
        {!isAuthenticated ? (
          <>
            <Route path="/signin" element={<SignIn />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </>
        ) : (
          /* Authenticated Routes */
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={<Navigate to={getFirstAccessiblePath} replace />}
            />
            {userRoutes.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<ProtectedRoute>{route.element}</ProtectedRoute>}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </>
  );
}
