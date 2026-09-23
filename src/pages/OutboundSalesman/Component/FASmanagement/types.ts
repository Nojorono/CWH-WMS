/** Types untuk FAS User Management CRUD — sesuai response API */

export type FasOrganization = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  organization_code?: string;
  organization_id?: string;
  organization_name?: string;
  org_name?: string;
  org_id?: string;
  organization_type?: string;
  region_code?: string;
  address?: string;
  location_id?: string;
  start_date_active?: string;
  end_date_active?: string | null;
};

/** User di dalam group organization (raw API) */
export type FasUserApi = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  organization?: FasOrganization | null;
  organizationId?: string;
  organization_id?: string;
  name: string;
  email: string;
};

/** Group per organization dari GET list */
export type FasOrgGroupApi = {
  organization_id: string;
  organization_code?: string;
  organization_name?: string;
  users: FasUserApi[];
};

/** Row flat untuk tabel CRUD */
export type FasUser = {
  id: string;
  organization_id: string;
  organization_code?: string;
  organization_name?: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  organization?: FasOrganization | null;
};

export type FasUserPayload = {
  organization_id: string;
  name: string;
  email: string;
};

export type FasListParams = {
  page?: number;
  limit?: number;
  sortOrder?: "ASC" | "DESC";
  organization_id?: string;
  name?: string;
  email?: string;
};

export type FasListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type FasListResult = {
  data: FasUser[];
  meta: FasListMeta;
};
