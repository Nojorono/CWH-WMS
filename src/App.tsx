import { AppRoutes } from "./routes";
import NotificationManager from "./utils/Socket/NotificationManager";
import { useAuthStore } from "./API/store/AuthStore/authStore"; // contoh ambil userId

export default function App() {
  const user = useAuthStore((state) => state.user); // pastikan ada id user

  return (
    <>
      <AppRoutes />
      {user?.id && <NotificationManager userId={user.id} />}
    </>
  );
}

// src/App.tsx
// import { useEffect } from "react";
// import { AppRoutes } from "./routes";
// import { initNotificationService } from "./utils/Socket/Service/notificationService";

// export default function App() {
//   const userId = localStorage.getItem("user_id"); // atau ambil dari auth context
//   console.log("Initializing Notification Service for user:", userId);

//   useEffect(() => {
//     const userId = localStorage.getItem("user_id"); // atau ambil dari auth context
//     console.log("Initializing Notification Service for user:", userId);

//     if (userId) initNotificationService(userId);
//   }, []);

//   return <AppRoutes />;
// }
