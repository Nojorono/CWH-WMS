import { JSX, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { ProtectedRoute } from "./utils/ProtectedRoute";
import { signOut } from "./utils/SignOut";
import { useAuthStore } from "./API/store/AuthStore/authStore";

// Import all page components
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

export function AppRoutes() {
  const navigate = useNavigate();
  const token =
    useAuthStore((state) => state.accessToken) ||
    localStorage.getItem("accessToken");

  // ✅ Auth check
  const isAuthenticated = !!token;

  // ✅ Jika tidak ada token → sign out langsung
  useEffect(() => {
    if (!isAuthenticated) signOut(navigate);
  }, [isAuthenticated, navigate]);

  // ✅ Ambil menu user dari Zustand / LocalStorage
  const userMenus =
    useAuthStore((state) => state.menus) ||
    (() => {
      const stored = localStorage.getItem("user_login_data");
      try {
        return stored && stored !== "undefined"
          ? JSON.parse(stored).menus ?? []
          : [];
      } catch {
        console.warn("Failed to parse user_login_data");
        return [];
      }
    })();

  // ✅ Manual sub-routes (detail, process, dsb.)
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

  // ✅ Map path → Komponen
  const pageMap: Record<string, JSX.Element> = {
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

  // ✅ Buat route dinamis berdasarkan menu API
  const userRoutes = useMemo(() => {
    const routes: { id: string; path: string; element: JSX.Element }[] = [];

    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.path) {
          const element = pageMap[item.path] || <NotFound />;
          routes.push({
            id: item.id || item.path,
            path: item.path,
            element,
          });

          // Tambahkan manual sub-route
          const children = manualChildRoutes[item.path];
          if (children) {
            children.forEach((child) => {
              routes.push({
                id: `${item.path}-${child.path}`,
                path: `${item.path}/${child.path}`,
                element: child.element,
              });
            });
          }

          // Rekursif untuk anak
          if (item.children?.length) traverse(item.children);
        }
      });
    };

    traverse(userMenus);
    return routes;
  }, [userMenus]);

  // ✅ Render route
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Default redirect: belum login → ke /signin */}
        {!isAuthenticated && (
          <Route path="/" element={<Navigate to="/signin" replace />} />
        )}

        {/* Login page */}
        <Route path="/signin" element={<SignIn />} />

        {/* Jika sudah login → tampilkan layout & menu */}
        {isAuthenticated && (
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

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}


// import { JSX, useEffect, useMemo } from "react";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import AppLayout from "./layout/AppLayout";
// import SignIn from "./pages/AuthPages/SignIn";
// import { signOut } from "./utils/SignOut";
// import { ScrollToTop } from "./components/common/ScrollToTop";
// import { useAuthStore } from "./API/store/AuthStore/authStore";
// import { ProtectedRoute } from "./utils/ProtectedRoute";

// // Pages...
// import {
//   MasterMenu,
//   MasterPallet,
//   MasterUser,
//   MasterRole,
//   CreateRole,
//   UpdateRole,
//   Inbound,
//   InboundProcess,
//   MasterUOM,
//   MasterIO,
//   MasterWarehouse,
//   MasterItem,
//   MasterClassification,
//   MasterVehicle,
//   MasterZone,
//   MasterBin,
//   MasterSource,
//   MasterSupplier,
//   Inventory,
//   PutAway,
//   PutAwayProcess,
//   MainTabPallet,
//   MainTabZone,
//   InventoryDetail,
//   Memo,
//   MemoProcess,
// } from "./utils/PagesComponent";
// import NotFound from "./pages/OtherPage/NotFound";

// // import dummyRoutes from "./helper/dummyRoutes";

// const DefaultPage = () => (
//   <div style={{ textAlign: "center", marginTop: "50px" }}>
//     <NotFound />
//   </div>
// );

// export function AppRoutes() {
//   const navigate = useNavigate();
//   const token =
//     useAuthStore((state) => state.accessToken) ||
//     localStorage.getItem("accessToken");

//   const localUserMenus = useMemo(() => {
//     const stored = localStorage.getItem("user_login_data");
//     try {
//       return stored && stored !== "undefined"
//         ? JSON.parse(stored).menus ?? []
//         : [];
//     } catch {
//       console.warn("Failed to parse user_login_data");
//       return [];
//     }
//   }, []);

//   const userMenus = useAuthStore((state) => state.menus) || localUserMenus;

//   const isAuthenticated = () => {
//     if (token) {
//       localStorage.setItem("accessToken", token);
//       return true;
//     }
//     return false;
//   };

//   useEffect(() => {
//     if (!isAuthenticated()) {
//       signOut(navigate);
//     }
//   }, [navigate]);

//   const manualChildRoutes: Record<
//     string,
//     { path: string; element: JSX.Element }[]
//   > = {
//     "/master_role": [
//       { path: "create", element: <CreateRole /> },
//       { path: "update", element: <UpdateRole /> },
//     ],
//     "/master_pallet": [{ path: "detail", element: <MainTabPallet /> }],
//     "/master_zone": [{ path: "detail", element: <MainTabZone /> }],
//     "/inbound_planning": [{ path: "process", element: <InboundProcess /> }],
//     "/putaway": [{ path: "process", element: <PutAwayProcess /> }],
//     "/inventory": [{ path: "detail", element: <InventoryDetail /> }],
//     "/memo": [{ path: "process", element: <MemoProcess /> }],
//   };

//   const getElementByPath = (path: string): JSX.Element | null => {
//     const map: Record<string, JSX.Element> = {
//       "/master_user": <MasterUser />,
//       "/master_menu": <MasterMenu />,
//       "/master_role": <MasterRole />,
//       "/master_pallet": <MasterPallet />,
//       "/inbound_planning": <Inbound />,
//       "/putaway": <PutAway />,
//       "/master_uom": <MasterUOM />,
//       "/master_io": <MasterIO />,
//       "/master_warehouse": <MasterWarehouse />,
//       "/master_item": <MasterItem />,
//       "/master_supplier": <MasterSupplier />,
//       "/master_classification": <MasterClassification />,
//       "/master_vehicle": <MasterVehicle />,
//       "/master_zone": <MasterZone />,
//       "/master_bin": <MasterBin />,
//       "/master_source": <MasterSource />,
//       "/inventory": <Inventory />,
//       "/memo": <Memo />,
//     };
//     return map[path] || <DefaultPage />;
//   };

//   const userRoutes = useMemo(() => {
//     const routes: { id: string; path: string; element: JSX.Element }[] = [];

//     const traverse = (items: any[]) => {
//       items.forEach((item) => {
//         if (item.path) {
//           const Element = getElementByPath(item.path);
//           if (Element) {
//             routes.push({
//               id: item.id || item.path,
//               path: item.path,
//               element: Element,
//             });
//           }

//           const childRoutes = manualChildRoutes[item.path];
//           if (childRoutes) {
//             childRoutes.forEach((child) => {
//               routes.push({
//                 id: `${item.path}-${child.path}`,
//                 path: `${item.path}/${child.path}`,
//                 element: child.element,
//               });
//             });
//           }

//           if (item.children?.length) {
//             traverse(item.children);
//           }
//         }
//       });
//     };

//     traverse(userMenus);
//     return routes;
//   }, [userMenus]);

//   return (
//     <>
//       <ScrollToTop />
//       {/* <Routes>
//         {isAuthenticated() ? (
//           <Route
//             element={
//               <ProtectedRoute>
//                 <AppLayout />
//               </ProtectedRoute>
//             }
//           >
//             <Route path="/" element={<SignIn />} />
//             {userRoutes.map((route) => (
//               <Route
//                 key={route.id}
//                 path={route.path}
//                 element={<ProtectedRoute>{route.element}</ProtectedRoute>}
//               />
//             ))}
//           </Route>
//         ) : (
//           <Route path="*" element={<Navigate to="/signin" replace />} />
//         )}
//         <Route path="/signin" element={<SignIn />} />
//       </Routes> */}

//       <Routes>
//         {/* Jika belum login, redirect ke /signin */}
//         {!isAuthenticated() && (
//           <Route path="/" element={<Navigate to="/signin" replace />} />
//         )}

//         {/* Route login */}
//         <Route path="/signin" element={<SignIn />} />

//         {/* Jika sudah login */}
//         {isAuthenticated() && (
//           <Route
//             element={
//               <ProtectedRoute>
//                 <AppLayout />
//               </ProtectedRoute>
//             }
//           >
//             {userRoutes.map((route) => (
//               <Route
//                 key={route.id}
//                 path={route.path}
//                 element={<ProtectedRoute>{route.element}</ProtectedRoute>}
//               />
//             ))}
//           </Route>
//         )}

//         {/* 404 */}
//         <Route path="*" element={<NotFound />} />
//       </Routes>
//     </>
//   );
// }