export interface Item {
  id?: string;
  sku: string;
  item_number?: string | null;
  description: string;
  inventory_item_id?: number | null;
  dus_per_stack?: number | null;
  bal_per_dus?: number | null;
  press_per_bal?: number | null;
  bks_per_press?: number | null;
  btg_per_bks?: number | null;
  organization_id: number;
}

export type CreateItem = Omit<Item, "id">;
export type UpdateItem = Partial<CreateItem>;
