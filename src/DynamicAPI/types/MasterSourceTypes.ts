export interface Source {
  organization_id: number;
  name: string;
  code: string;
  type: string;
  url: string;
}

export type CreateSource = Omit<Source, "id">;
export type UpdateSource = Partial<CreateSource>;
