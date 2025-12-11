// PutAwayTypes.tsx

// ===========================
// Base Interface
// ===========================
export interface PutAway {
  palletItems: never[];
  destinationBin: {};
  id?: string;
  inventory_tracking_id: string;
  destination_bin_id: string;
  forklift_driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;
}

// ===========================
// Create & Update Types (POST / PUT / PATCH)
// ===========================
export type CreatePutAway = Omit<PutAway, "id">;
export type UpdatePutAway = Partial<CreatePutAway>;

// ===========================
// GET Response Types
// ===========================

// Pallet nested structure
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

// WarehouseSub nested structure
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
  capacity_bin: number;
  barcode_image_url: string;
  is_staging: boolean | null;
}

// InventoryTracking nested structure (extended)
export interface InventoryTracking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  pallet_id: string;
  pallet?: Pallet;
  warehouse_id: string;
  warehouse_sub_id: string;
  warehouseSub?: WarehouseSub;
  warehouse_bin_id: string | null;
  inventory_date: string;
  inventory_status: string;
  progression_status?: string;
  inventory_note: string;
}

// DestinationBin nested structure
export interface DestinationBin {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description: string;
  capacity_pallet: number;
  barcode_image_url: string;
  current_pallet: string | null;
}

// Pallet item structure (top-level array in response)
export interface PalletItem {
  item_id: string;
  item_name: string;
  current_quantity: number;
  uom: string;
  last_updated: string;
  production_date: string;
  week_number: number;
}

// Full GET response shape (extended)
export interface PutAwayResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  inventory_tracking_id: string;
  inventoryTracking: InventoryTracking;

  destination_bin_id: string;
  destinationBin: DestinationBin;

  forklift_driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;

  // optional array present in API example
  palletItems?: PalletItem[];
}

// In case API returns array
export type PutAwayListResponse = PutAwayResponse[];
