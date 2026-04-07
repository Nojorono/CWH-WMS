import { create } from "zustand";
import { loginService } from "../../services/AuthServices/AuthService";

interface LoginPayload {
  username?: string;
  password?: string;
  employee_id?: string;
  ip_address?: string;
  device_info?: string;
  platform?: string;
}

interface User {
  id: string;
  username: string;
  roleId: number;
  role: {
    id: number;
    name: string;
    description: string;
  };
  userDetail: UserDetail;
}

interface UserDetail {
  id: string;
  userId: string;
  employee_id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  organizationId: number | null;
}

interface Menu {
  id: number;
  name: string;
  path: string;
  icon: string | null;
  parentId: number | null;
  order: number;
  actions: string[];
}

interface Permission {
  id: number;
  role_id: number;
  menu_id: number;
  permission_type: string;
  created_at: string;
  updated_at: string;
}

// ✅ Tambahkan tipe return khusus untuk authLogin
interface AuthLoginResponse {
  user: User;
  menus: Menu[];
  permissions: Permission[];
  accessToken: string;
  refreshToken?: string | null;
}

interface AuthState {
  resetAuth: () => void;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  userDetail: UserDetail | null;
  menus: Menu[] | null;
  permissions: Permission[] | null;
  authLogin: (data: LoginPayload) => Promise<AuthLoginResponse>; // ✅ perbaikan di sini
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  user: null,
  userDetail: null,
  menus: null,
  permissions: null,

  authLogin: async (data: LoginPayload) => {
    set({ isLoading: true, error: null });

    try {
      const response = await loginService(data);
      const resData = response.data?.data || response.data || response;

      if (!resData || !resData.accessToken || !resData.user) {
        throw new Error("Invalid login response structure");
      }

      const accessToken = resData.accessToken;
      const refreshToken = resData.refreshToken || null;
      const user = resData.user;
      const userDetail = user.userDetail;
      const menus = resData.menus || [];
      const permissions = resData.permissions || [];

      console.log("login resData", resData);


      // Simpan ke localStorage
      localStorage.setItem(
        "user_login_data",
        JSON.stringify({ accessToken, refreshToken, user, menus, permissions })
      );

      localStorage.setItem("role_id", user?.roleId?.toString() || "");
      localStorage.setItem("role_name", user?.role?.name || "");
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user_id", user?.id?.toString() || "");
      localStorage.setItem("username", user?.username || "");
      localStorage.setItem("menus", JSON.stringify(menus));
      localStorage.setItem("user_detail", JSON.stringify(userDetail));
      localStorage.setItem("email", userDetail?.email || "");
      localStorage.setItem("phone", userDetail?.phone || "");
      localStorage.setItem("full_name", `${userDetail?.firstName} ${userDetail?.lastName}`);

      // Update state global
      set({
        accessToken,
        refreshToken,
        user,
        userDetail,
        menus,
        permissions,
        isLoading: false,
        error: null,
      });

      // ✅ Return data agar bisa digunakan di SignInForm
      return { user, menus, permissions, accessToken, refreshToken };
    } catch (err: any) {
      console.error("Login failed:", err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  resetAuth: () => {
    set({
      isLoading: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      user: null,
      menus: null,
      permissions: null,
    });
    localStorage.removeItem("user_login_data");
    localStorage.removeItem("role_id");
    localStorage.removeItem("token");
  },
}));
