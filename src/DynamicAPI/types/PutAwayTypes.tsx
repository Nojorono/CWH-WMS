// export interface PutAway {
//   id?: string;
//   inventory_tracking_id: string;
//   destination_bin_id: string;
//   forklift_driver_id: string;
//   driver_name: string;
//   driver_phone: string;
//   status: string;
//   notes: string;
// }

// export type CreatePutAway = Omit<PutAway, "id">;
// export type UpdatePutAway = Partial<CreatePutAway>;

// ===========================
// Base Interface
// ===========================
export interface PutAway {
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

// Nested structure: InventoryTracking
export interface InventoryTracking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  pallet_id: string;
  warehouse_id: string;
  warehouse_sub_id: string;
  warehouse_bin_id: string | null;
  inventory_date: string;
  inventory_status: string;
  inventory_note: string;
}

// Nested structure: DestinationBin
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

// Full GET response shape
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
}

// In case API returns array
export type PutAwayListResponse = PutAwayResponse[];
