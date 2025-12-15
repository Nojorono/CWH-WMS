export interface Bin {
  // id?: string;
  // organization_id: number;
  // warehouse_sub_id: string;
  // name: string;
  // code: string;
  // description: string;
  // capacity_pallet: number;

  id?: string;
  organization_id: number;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description: string;
  capacity_pallet: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  barcode_image_url?: string | null;
  current_pallet?: number | null;
}

export type CreateBin = Omit<Bin, "id">;
export type UpdateBin = Partial<CreateBin>;
