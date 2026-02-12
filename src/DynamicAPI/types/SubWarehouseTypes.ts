export interface SubWarehouse {
  id: string;
  organization_id: number;
  warehouse_id: string;
  name: string;
  code: string;
  description: string;
  capacity_bin?: number;
  barcode_image_url?: string;
  is_staging?: string;
  is_good_stock?: boolean;
  is_gate?: boolean;
}

export type CreateSubWarehouse = Omit<SubWarehouse, "id">;
export type UpdateSubWarehouse = Partial<CreateSubWarehouse>;
