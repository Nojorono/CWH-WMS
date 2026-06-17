// Payload untuk request login
export interface LoginPayload {
  username?: string;
  password?: string;
  employee_id?: string;
  ip_address?: string;
  device_info?: string;
  platform?: string;
}

// Detail Organisasi lengkap sesuai JSON API
export interface Organization {
  id: string;
  organization_code: string;
  organization_id: string;
  organization_name: string;
  org_name: string;
  org_id: string;
  organization_type: string;
  region_code: string;
  address: string;
  location_id: string;
  start_date_active: string;
  end_date_active: string | null;
}

export interface UserDetail {
  id: string;
  userId: string;
  employee_id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  organization: Organization;
  organizationId: string;
  warehouse_sub_id: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface User {
  id: string;
  username: string;
  isActive: boolean;
  roleId: number;
  role: Role;
  userDetail: UserDetail;
}

export interface Menu {
  id: number;
  name: string;
  path: string;
  icon: string | null;
  parentId: number | null;
  order: number;
  actions: string[];
  children?: Menu[]; // Support untuk nested menu
}

// Data utama yang dikembalikan API
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
  menus: Menu[];
}

// Wrapper standar API kamu
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

// --- STORE TYPES ---
export interface AuthPersistState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  menus: Menu[] | null;
  ioList: any[] | null; 
}

export interface AuthState extends AuthPersistState {
  _hasHydrated: boolean; // Tambahkan flag ini
  isLoading: boolean;
  error: string | null;
  authLogin: (payload: LoginPayload) => Promise<AuthData>;
  resetAuth: () => void;
  setIOList: (ioList: any[]) => void;
}