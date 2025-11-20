export interface Io {
  id: any;
  organization_id: number;
  organization_name: string;
  operating_unit: string;
}

export type CreateIo = Omit<Io, "id">;
export type UpdateIo = Partial<CreateIo>;
