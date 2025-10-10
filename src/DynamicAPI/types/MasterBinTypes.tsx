export interface Bin {
  id?: string;
  organization_id: number;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description: string;
  capacity_pallet: number;
}

export type CreateBin = Omit<Bin, "id">;
export type UpdateBin = Partial<CreateBin>;
