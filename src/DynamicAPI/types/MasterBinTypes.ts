export interface Bin {

  id?: string;
  organization_id?: any;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description: string;
  capacity_pallet: number | null;
  locator_id?: Number;
  locator_name?: String;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type CreateBin = Omit<Bin, "id">;
export type UpdateBin = Partial<CreateBin>;
