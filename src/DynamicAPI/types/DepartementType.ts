export interface Department {
    id: string;
    departement_code: string;
    departement_name: string;
    is_active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
}

// Utility types untuk form/request
export type CreateDepartment = Omit<Department, "id" | "createdAt" | "updatedAt">;
export type UpdateDepartment = Partial<Omit<Department, "id" | "createdAt" | "updatedAt">>;