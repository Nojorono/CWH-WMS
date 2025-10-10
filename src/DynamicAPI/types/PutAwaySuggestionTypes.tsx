// =============================
// SHARED TYPES
// =============================

// Pallet structure (nested in stagingPallet)
export interface Pallet {
  id: string;
  pallet_code: string;
  currentQuantity: number;
}

// Warehouse info
export interface Warehouse {
  id: string;
  name: string;
}

// Warehouse Sub (staging area)
export interface WarehouseSub {
  id: string;
  name: string;
}

// Suggested Zone & Bin
export interface Zone {
  id: string;
  name: string;
}

export interface Bin {
  id: string;
  name: string;
}

// =============================
// CORE ENTITY: PutAway Suggestion
// =============================

export interface StagingPallet {
  id: string;
  pallet: Pallet;
  warehouse: Warehouse;
  warehouseSub: WarehouseSub;
}

export interface PutAwaySuggestion {
  id: string;
  stagingPallet: StagingPallet;
  suggestedZone: Zone;
  suggestedBin: Bin;
}

// =============================
// CREATE / UPDATE (payloads)
// =============================

export type CreatePutAwaySuggestion = Omit<PutAwaySuggestion, "id">;
export type UpdatePutAwaySuggestion = Partial<CreatePutAwaySuggestion>;

// =============================
// READ / RESPONSE STRUCTURE
// =============================

export interface PutAwaySuggestionData {
  palletSuggestions: PutAwaySuggestion[];
}

export interface PutAwaySuggestionResponse {
  success: boolean;
  data: PutAwaySuggestionData;
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
  driver: string;
}
