import { AppRoutes } from "./routes";
// import NotificationManager from "./utils/Socket/NotificationManager";
import { useAuthStore } from "./API/store/AuthStore/authStore"; // contoh ambil userId

export default function App() {
  const user = useAuthStore((state) => state.user); // pastikan ada id user

  return (
    <div className="">
      <AppRoutes />
      {/* {user?.id && <NotificationManager userId={user.id} />} */}
    </div>
  );
}
