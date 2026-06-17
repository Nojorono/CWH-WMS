// import { AppRoutes } from "./routes";
// // import NotificationManager from "./utils/Socket/NotificationManager";
// import { useAuthStore } from "./API/store/AuthStore/authStore"; // contoh ambil userId

// export default function App() {
//   const user = useAuthStore((state) => state.user); // pastikan ada id user

//   return (
//     <div className="">
//       <AppRoutes />
//       {/* {user?.id && <NotificationManager userId={user.id} />} */}
//     </div>
//   );
// }


import { AppRoutes } from "./routes";
import { usePersistAuthStore } from "./API/store/AuthStore/PersistAuthStore";
// import NotificationManager from "./utils/Socket/NotificationManager";

export default function App() {
  // Ambil data user langsung dari store persistent
  const user = usePersistAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppRoutes />
      
      {/* Sistem WebSocket / Notification Manager Anda akan otomatis aktif 
        begitu user.id tersedia setelah proses login sukses 
      */}
      {/* {user?.id && <NotificationManager userId={user.id} />} */}
    </div>
  );
}