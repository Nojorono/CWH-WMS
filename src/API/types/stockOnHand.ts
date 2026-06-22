// File: src/API/types/stock.ts

export interface StockOnHand {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  item_code: string;
  item_number: string;
  item_description: string;
  inventory_item_id: number;
  oracle_organization_id: number;
  organization_code: string;
  organization_name: string;
  subinventory_code: string;
  locator_id: number;
  locator: string;
  locator_name: string | null;
  quantity: number;
  avail_to_reserve: number;
  total_submitted: number | null;
  created_by: string;
  updated_by: string;
}