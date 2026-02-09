export interface Warehouse {
  id: any;
  organization_id: number;
  name: string;
  description: string;
}

export type CreateWarehouse = Omit<Warehouse, "id">;
export type UpdateWarehouse = Partial<CreateWarehouse>;
