// // =============================
// // SHARED TYPES
// // =============================

// // Pallet structure (nested in stagingPallet)
// export interface Pallet {
//   id: string;
//   pallet_code: string;
//   currentQuantity: number;
// }

// // Warehouse info
// export interface Warehouse {
//   id: string;
//   name: string;
// }

// // Warehouse Sub (staging area)
// export interface WarehouseSub {
//   id: string;
//   name: string;
// }

// // Suggested Zone & Bin
// export interface Zone {
//   id: string;
//   name: string;
// }

// export interface Bin {
//   id: string;
//   name: string;
// }

// // =============================
// // CORE ENTITY: PutAway Suggestion
// // =============================

// export interface StagingPallet {
//   id: string;
//   pallet: Pallet;
//   warehouse: Warehouse;
//   warehouseSub: WarehouseSub;
// }

// export interface PutAwaySuggestion {
//   id: string;
//   stagingPallet: StagingPallet;
//   suggestedZone: Zone;
//   suggestedBin: Bin;
// }

// // =============================
// // CREATE / UPDATE (payloads)
// // =============================

// export type CreatePutAwaySuggestion = Omit<PutAwaySuggestion, "id">;
// export type UpdatePutAwaySuggestion = Partial<CreatePutAwaySuggestion>;

// // =============================
// // READ / RESPONSE STRUCTURE
// // =============================

// export interface PutAwaySuggestionData {
//   palletSuggestions: PutAwaySuggestion[];
// }

// export interface PutAwaySuggestionResponse {
//   success: boolean;
//   data: PutAwaySuggestionData;
//   message?: string;
// }

// // =============================
// // OPTIONAL: for table display
// // =============================

// export interface PutAwayRow {
//   palletId: string;
//   palletCode: string;
//   totalQty: number;
//   warehouseName: string;
//   stagingArea: string;
//   suggestZone: string;
//   suggestBin: string;
//   driver: string;
// }

// =============================
// SHARED TYPES
// =============================

// 🟩 Item di dalam pallet
export interface PalletItem {
  item_uom: string;
  item_id: string;
  item_name: string;
  current_quantity: number;
  uom: string;
  last_updated: string;
  production_date: string;
  week_number: number;
  pallet_id: string;
}

// 🟩 Struktur pallet (nested di stagingPallet)
export interface Pallet {
  id: string;
  pallet_code: string;
  currentQuantity: number;
  capacity?: number;
  isFull?: boolean;
  qr_image_url?: string;
  uom?: string;
}

// 🟩 Warehouse utama
export interface Warehouse {
  id: string;
  name: string;
  description?: string;
}

// 🟩 Warehouse sub (staging area)
export interface WarehouseSub {
  id: string;
  name: string;
  code?: string;
  description?: string;
  barcode_image_url?: string;
  is_staging?: string | null;
}

// 🟩 Zone dan Bin (saran penempatan)
export interface Zone {
  id: string;
  name: string;
  code?: string;
  description?: string;
  barcode_image_url?: string;
}

export interface Bin {
  id: string;
  name: string;
  code?: string;
  description?: string;
  barcode_image_url?: string;
}

// =============================
// CORE ENTITY: PutAway Suggestion
// =============================

export interface StagingPallet {
  id: string;
  pallet: Pallet;
  warehouse: Warehouse;
  warehouseSub: WarehouseSub;
  inventory_status?: string;
  progression_status?: string;
  inventory_note?: string;
  inventory_date?: string;
}

// 🟨 Versi lengkap (sesuai response API)
export interface PutAwaySuggestion {
  id?: string;
  stagingPallet: StagingPallet;
  suggestedZone: Zone;
  suggestedBin: Bin;
  palletItems: PalletItem[];
}

// =============================
// CREATE / UPDATE (payloads)
// =============================

export type CreatePutAwaySuggestion = Omit<PutAwaySuggestion, "id">;
export type UpdatePutAwaySuggestion = Partial<CreatePutAwaySuggestion>;

// =============================
// READ / RESPONSE STRUCTURE
// =============================

export interface PutAwaySuggestionResponse {
  success: boolean;
  data: PutAwaySuggestion;
  message?: string;
}

// =============================
// OPTIONAL: for table display
// =============================

export interface PutAwayRow {
  palletId: string;
  palletCode: string;
  totalQty: number;
  warehouseName: string;
  stagingArea: string;
  suggestZone: string;
  suggestBin: string;
  driver?: string;
}
