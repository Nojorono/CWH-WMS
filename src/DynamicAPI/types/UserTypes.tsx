export interface User {
  username: string;
  password: string;
  isActive: boolean;
  roleId: number;
  employeeId?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
}

export type CreateUser = Omit<User, "id">;
export type UpdateUser = Partial<CreateUser>;
