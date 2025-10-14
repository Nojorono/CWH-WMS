import { create } from 'zustand';
import { loginService } from '../../services/AuthServices/AuthService';


interface AuthState {
  resetAuth: any;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  menus: Menu[] | null;
  permissions: Permission[] | null; // Tambahkan ini
  authLogin: (data: LoginPayload) => Promise<void>;
}

interface LoginPayload {
  username?: string;
  password?: string;
  employee_id?: string;
  ip_address?: string;
  device_info?: string;
  platform?: string;
}

interface User {
  id: number;
  employee_id: string;
  username: string;
  picture: string;
  role_id: number;
  last_login: string;
}

interface Menu {
  id: number;
  name: string;
  path: string;
  icon: string | null;
  parentId: number | null;
  order: number;
  created_at: string;
  updated_at: string;
  permissions: Permission[]; // Tambahkan ini
}

interface Permission {
  id: number;
  role_id: number;
  menu_id: number;
  permission_type: string;
  created_at: string;
  updated_at: string;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  user: null,
  menus: null,
  permissions: null,

  authLogin: async (data: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginService(data);
      const accessToken = response.data.token;
      const refreshToken = response.data.refreshToken;
      const user = response.data.user;
      const menus = response.data.menus;
      const permissions = response.data.permissions;

      // Simpan ke localStorage
      localStorage.setItem(
        "user_login_data",
        JSON.stringify({ accessToken, refreshToken, user, menus, permissions })
      );

           // Get role name from user.role.name
      const roleName = user?.role?.name || "";

      localStorage.setItem("role_id", user?.roleId?.toString() || "");
      localStorage.setItem("role_name", roleName);
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user_id", user?.id?.toString() || "");

      set({
        accessToken,
        refreshToken,
        user,
        menus,
        permissions,
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
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
