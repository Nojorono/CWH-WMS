export interface UserManagement {
  id?: string;
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
  deletedAt?: string | null;
  name: string;
  phone: string;
  roleName: string;
}

export type CreateUserManagement = Omit<UserManagement, "id">;
export type UpdateUserManagement = Partial<CreateUserManagement>;
