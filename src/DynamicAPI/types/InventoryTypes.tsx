export interface Pallet {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  pallet_code: string;
  capacity: number;
  qr_image_url: string;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
}

export interface Warehouse {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  name: string;
  description: string;
}

export interface WarehouseSub {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  warehouse_id: string;
  name: string;
  code: string;
  description: string;
  capacity_bin: number | null;
  barcode_image_url: string;
  is_staging: string;
}

export interface WarehouseBin {
  // Define fields if not null, otherwise keep as 'any' or 'null'
  // Example:
  // id: string;
  // ...
}

export interface Inventory {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  pallet_id: string;
  pallet: Pallet;
  warehouse_id: string;
  warehouse: Warehouse;
  warehouse_sub_id: string;
  warehouseSub: WarehouseSub;
  warehouse_bin_id: string | null;
  warehouseBin: WarehouseBin | null;
  inventory_date: string;
  inventory_status: string;
  inventory_note: string;
}

// Untuk response GET ALL:
export interface InventoryResponse {
  data: Inventory[];
}
