export interface Io {
  // Identitas Utama
  id: string;
  organization_id: string;
  organization_name: string;
  organization_code: string;
  organization_type: string;

  // Organisasi/Unit Terkait
  org_id: string;
  org_name: string;
  operating_unit?: string;
  region_code: string;
  address: string;
  location_id: string;

  // Timestamps & Metadata
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  start_date_active?: string;
  end_date_active?: string | null;
}

export type CreateIo = Omit<Io, "id">;
export type UpdateIo = Partial<CreateIo>;
