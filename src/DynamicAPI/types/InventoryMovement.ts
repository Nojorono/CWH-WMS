// =============================
// SHARED TYPES
// =============================

export interface Pallet {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  pallet_code: string;
  capacity: number;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
  currentWeekNumber: number;
  currentItems: Array<{
    item_id: string;
    item_name: string;
    current_quantity: number;
    uom: string;
    production_date: string;
    week_number: number;
  }>;
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
  is_staging: string | null;
  is_good_stock: boolean;
  is_gate: boolean;
}

export interface WarehouseBin {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  organization_id?: number;
  warehouse_sub_id?: string;
  name?: string;
  code?: string;
  description?: string;
  capacity_pallet?: number;
  barcode_image_url?: string;
  current_pallet?: any;
  [key: string]: any;
}

// =============================
// MAIN INVENTORY TYPE
// =============================

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
  progression_status: string;
  inventory_note: string;
  inventoryTrackingBad: InventoryTrackingBad[];
}

// =============================
// API RESPONSE TYPES
// =============================

// GET ALL
export interface InventoryMovementListResponse {
  success: boolean;
  message: string;
  data: InventoryMovement[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timestamp: string;
  path: string;
}

// GET BY ID
export interface InventoryDetailResponse {
  success: boolean;
  message: string;
  data: Inventory;
  timestamp: string;
  path: string;
}

// GET BY PALLET ID (history)
export interface InventoryByPalletResponse {
  success: boolean;
  message: string;
  data: Inventory;
  timestamp: string;
  path: string;
}

export interface InventoryTrackingBad {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;

  // Tambahan properti baru sesuai data terbaru
  inbound_retur_id?: string;
  inventory_tracking_id?: string;
  item_id?: string;
  quantity?: number;
  uom?: string;
  production_date?: string;
  year?: number;
  hje?: string;
  notes?: string;
}

// =============================
// USER TYPE
// =============================
export interface InventoryMovementUser {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inventory_movement_id: string;
  user_id: string;
  user: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    username: string;
    password: string;
    isActive: boolean;
    roleId: number;
  };
  user_name: string;
  user_phone: string;
}

// =============================
// INVENTORY TRACKING TYPE
// =============================
export interface InventoryTracking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  pallet_id: string;
  warehouse_id: string;
  warehouse_sub_id: string;
  warehouse_bin_id: string;
  inventory_date: string;
  inventory_status: string;
  progression_status: string;
  inventory_note: string;
}

// =============================
// MOVEMENT PALLET TYPE
// =============================
export interface InventoryMovementPallet {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inventory_movement_id: string;
  pallet_id: string;
  pallet: Pallet;
  inventory_tracking_id: string;
  inventoryTracking: InventoryTracking;
  is_completed: boolean;
  completed_at: string | null;
}

// =============================
// MAIN INVENTORY MOVEMENT TYPE
// =============================
export interface InventoryMovement {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  movement_number: string;
  movement_type: string;
  pallets: InventoryMovementPallet[];
  users: InventoryMovementUser[];
  source_warehouse_id: string;
  sourceWarehouse: Warehouse;
  source_warehouse_sub_id: string;
  sourceWarehouseSub: WarehouseSub;
  source_bin_id: string;
  sourceBin: WarehouseBin;
  destination_warehouse_id: string;
  destinationWarehouse: Warehouse;
  destination_warehouse_sub_id: string;
  destinationWarehouseSub: WarehouseSub;
  destination_bin_id: string;
  destinationBin: WarehouseBin;
  status: string;
  completed_date: string;
  notes: string | null;
}
