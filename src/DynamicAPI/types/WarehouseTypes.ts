export interface Warehouse {
  id: any;
  organization_id: number;
  name: string;
  description: string;
  locator_id?: number;
  locator_name?: string;
}

export type CreateWarehouse = Omit<Warehouse, "id">;
export type UpdateWarehouse = Partial<CreateWarehouse>;
