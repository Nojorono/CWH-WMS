// ============================================================
// BASE / NESTED TYPES
// ============================================================

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  employee_id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  organizationId: string | null;
}

// ============================================================
// GET USER (Response dari API)
// ============================================================

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  username: string;
  password: string;
  isActive: boolean;
  role: Role;
  roleId: number;
  userDetail: UserDetail;
}

// ============================================================
// CREATE USER (Request Body)
// ============================================================

export interface CreateUser {
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

// ============================================================
// UPDATE USER (Request Body — semua field opsional)
// ============================================================

export type UpdateUser = Partial<CreateUser>;