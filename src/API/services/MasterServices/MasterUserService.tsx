// // import axiosInstance from "../AxiosInstance";

// // interface User {
// //   id: number;
// //   email: string;
// //   username: string;
// //   role_id: number;
// //   created_at: string;
// //   updated_at: string;
// //   deleted_at: string | null;
// //   created_by: string;
// //   employee_id: string | null;
// //   is_active: boolean;
// //   join_date: string | null;
// //   picture: string;
// //   updated_by: string;
// //   valid_from: string;
// //   valid_to: string | null;
// //   last_login: string | null;
// //   phone: string | null;
// //   user_uuid: string | null;
// //   branch_id: number | null;
// //   region_code: string | null;
// //   non_employee: boolean;
// //   role_name: string;
// //   role_description: string;
// //   organization_name: string | null;
// //   organization_code: string | null;
// //   employee_name: string | null;
// //   supervisor_number: string | null;
// //   salesrep_name: string | null;
// //   role: {
// //     id: number;
// //     name: string;
// //     description: string;
// //   };
// //   branch: any | null; // Update this type if you have a specific structure for branch
// //   employee: any | null; // Update this type if you have a specific structure for employee
// // }

// // interface UpdateUser {
// //   role_id: number;
// //   branch_id: number;
// //   region_code: string;
// //   supervisor_number: string;
// //   phone: string;
// //   is_active: boolean;
// //   is_sales:boolean;
// //   valid_from: string;
// //   valid_to: string;
// //   updated_by: string;
// //   name: string;
// // }

// // // GET all users
// // export const fetchAllUser = async () => {
// //   try {
// //     const res = await axiosInstance.get("/admin/user/all");
// //     return res.data.data;
// //   } catch (error: any) {
// //     console.error(
// //       "Failed to fetch users:",
// //       error.response?.data || error.message
// //     );
// //     throw new Error(error.response?.data?.message || "Failed to fetch users");
// //   }
// // };

// // // POST a new user
// // export const createUser = async (payload: User) => {
// //   console.log("Creating user with payload:", payload);

// //   const res = await axiosInstance.post("/admin/user", payload);
// //   if (res.data.statusCode !== 200) {
// //     throw new Error(res.data.message || "Gagal tambah user");
// //   }
// //   return res.data;
// // };

// // export const fetchDetailUser = async (employee_id: any) => {
// //   try {
// //     const res = await axiosInstance.get(`/user/profile/${employee_id}`);
// //     return res.data.data;
// //   } catch (error: any) {
// //     console.error(
// //       "Failed to fetch users:",
// //       error.response?.data || error.message
// //     );
// //     throw new Error(error.response?.data?.message || "Failed to fetch users");
// //   }
// // };

// // // PUT update user
// // export const updateUser = async (employeeId: string, payload: UpdateUser) => {

// //   try {
// //     const res = await axiosInstance.put(`/user/${employeeId}`, payload);
// //     if (res.data.statusCode !== 200) {
// //       throw new Error(res.data.message || "Gagal update user");
// //     }
// //     return res.data;
// //   } catch (error: any) {
// //     console.error(
// //       "Failed to update user:",
// //       error.response?.data || error.message
// //     );
// //     throw new Error(error.response?.data?.message || "Failed to update user");
// //   }
// // };

// import axiosInstance from "../AxiosInstance";

// // ===== INTERFACES =====

// export interface CreateUserPayload {
//   username: string;
//   password: string;
//   isActive: boolean;
//   roleId: number;
//   employeeId: string;
//   email: string;
//   phone: string;
//   organizationId: string;
//   warehouseSubId: string;
//   firstName: string;
//   lastName: string;
// }

// export interface UpdateUserPayload {
//   username?: string;
//   isActive?: boolean;
//   roleId?: number;
//   employeeId?: string;
//   email?: string;
//   phone?: string;
//   organizationId?: string;
//   warehouseSubId?: string;
//   firstName?: string;
//   lastName?: string;
// }

// export interface User {
//   id: number;
//   email: string;
//   username: string;
//   isActive: boolean;
//   roleId: number;
//   employeeId: string | null;
//   phone: string | null;
//   organizationId: string | null;
//   warehouseSubId: string | null;
//   firstName: string;
//   lastName: string;
//   createdAt: string;
//   updatedAt: string;
//   deletedAt: string | null;
//   createdBy: string;
//   updatedBy: string;
//   role: {
//     id: number;
//     name: string;
//     description: string;
//   };
// }

// // ===== API FUNCTIONS =====

// // GET all users
// export const fetchAllUser = async (): Promise<User[]> => {
//   try {
//     const res = await axiosInstance.get("/admin/user/all");
//     return res.data.data;
//   } catch (error: any) {
//     console.error(
//       "Failed to fetch users:",
//       error.response?.data || error.message,
//     );
//     throw new Error(error.response?.data?.message || "Failed to fetch users");
//   }
// };

// // POST a new user
// export const createUser = async (payload: CreateUserPayload): Promise<any> => {
//   try {
//     console.log("Creating user with payload:", payload);
//     const res = await axiosInstance.post("/admin/user", payload);
//     if (res.data.statusCode !== 200) {
//       throw new Error(res.data.message || "Gagal tambah user");
//     }
//     return res.data;
//   } catch (error: any) {
//     console.error(
//       "Failed to create user:",
//       error.response?.data || error.message,
//     );
//     throw new Error(error.response?.data?.message || "Failed to create user");
//   }
// };

// // GET detail user by ID
// export const fetchDetailUser = async (id: string): Promise<User> => {
//   try {
//     const res = await axiosInstance.get(`/user/profile/${id}`);
//     return res.data.data;
//   } catch (error: any) {
//     console.error(
//       "Failed to fetch user detail:",
//       error.response?.data || error.message,
//     );
//     throw new Error(
//       error.response?.data?.message || "Failed to fetch user detail",
//     );
//   }
// };

// // PUT update user
// export const updateUser = async (
//   id: string,
//   payload: UpdateUserPayload,
// ): Promise<any> => {
//   try {
//     const res = await axiosInstance.put(`/user/${id}`, payload);
//     if (res.data.statusCode !== 200) {
//       throw new Error(res.data.message || "Gagal update user");
//     }
//     return res.data;
//   } catch (error: any) {
//     console.error(
//       "Failed to update user:",
//       error.response?.data || error.message,
//     );
//     throw new Error(error.response?.data?.message || "Failed to update user");
//   }
// };

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
    console.log("Creating user with payload:", payload);
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
