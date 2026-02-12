export interface Uom {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export type CreateUom = Omit<Uom, "id">;
export type UpdateUom = Partial<CreateUom>;
