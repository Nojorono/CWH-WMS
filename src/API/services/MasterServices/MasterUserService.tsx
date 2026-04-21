import axiosInstance from "../AxiosInstance";

// ===== INTERFACES =====

export interface CreateUserPayload {
  username: string;
  password: string;
  isActive: boolean;
  roleId: number;
  employeeId: string;
  email: string;
  phone: string;
  organizationId: string;
  warehouseSubId: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserPayload {
  username?: string;
  isActive?: boolean;
  roleId?: number;
  employeeId?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  warehouseSubId?: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id: string;
  username: string;
  isActive: boolean;
  roleId: number;
  role: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  // Dari userDetail (di-flatten saat fetch)
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  employeeId: string | null;
  organizationId: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Helper: flatten userDetail ke root object
const mapUser = (raw: any): User => ({
  id: raw.id,
  username: raw.username,
  isActive: raw.isActive,
  roleId: raw.roleId,
  role: raw.role,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  deletedAt: raw.deletedAt,
  // Flatten dari userDetail
  email: raw.userDetail?.email ?? null,
  phone: raw.userDetail?.phone ?? null,
  firstName: raw.userDetail?.firstName ?? null,
  lastName: raw.userDetail?.lastName ?? null,
  employeeId: raw.userDetail?.employee_id ?? null,
  organizationId: raw.userDetail?.organizationId ?? null,
});

// ===== API FUNCTIONS =====

// GET all users
export const fetchAllUser = async (): Promise<User[]> => {
  try {
    const res = await axiosInstance.get("/admin/user/all");
    const rawList: any[] = res.data.data ?? [];
    return rawList.map(mapUser);
  } catch (error: any) {
    console.error(
      "Failed to fetch users:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

// POST a new user
export const createUser = async (payload: CreateUserPayload): Promise<any> => {
  try {
    const res = await axiosInstance.post("/admin/user", payload);
    if (res.data.statusCode !== 200) {
      throw new Error(res.data.message || "Gagal tambah user");
    }
    return res.data;
  } catch (error: any) {
    console.error(
      "Failed to create user:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.message || "Failed to create user");
  }
};

// GET detail user by ID
export const fetchDetailUser = async (id: string): Promise<User> => {
  try {
    const res = await axiosInstance.get(`/user/profile/${id}`);
    return mapUser(res.data.data);
  } catch (error: any) {
    console.error(
      "Failed to fetch user detail:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to fetch user detail",
    );
  }
};

// PUT update user
export const updateUser = async (
  id: string,
  payload: UpdateUserPayload,
): Promise<any> => {
  try {
    const res = await axiosInstance.put(`/user/${id}`, payload);
    if (res.data.statusCode !== 200) {
      throw new Error(res.data.message || "Gagal update user");
    }
    return res.data;
  } catch (error: any) {
    console.error(
      "Failed to update user:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.message || "Failed to update user");
  }
};
