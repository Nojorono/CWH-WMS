export interface Warehouse {
  id: any;
  organization_id: string | number; 
  name: string;
  description: string;
  locator_id?: number | string | null; 
  locator_name?: string | null;
}

export type CreateWarehouse = Omit<Warehouse, "id">;
export type UpdateWarehouse = Partial<CreateWarehouse>;