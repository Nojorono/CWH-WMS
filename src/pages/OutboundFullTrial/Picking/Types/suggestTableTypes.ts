export interface SuggestedLocation {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  quantity_ready_to_pick: number;
  uom: string;
  warehouse_name: string;
  warehouse_sub_name: string;
  warehouse_sub_code: string;
  warehouse_sub_id: string;
  bin_id: string;
  bin_name: string;
  bin_code: string;
  search_level: string;
  location_type: string;
  location_priority: number;
  week_number: number;
  production_date: string;
  place: string;
}

export interface Item {
  memo_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  required_quantity: number;
  already_picked_quantity: number;
  remaining_quantity_needed: number;
  suggested_locations: SuggestedLocation[];
  total_suggested_quantity: number;
  priority: number;
  notes: string;
  qty_pick?: number;
  week_number?: number;
  uom?: string;
  // internal flags for UI only
  _localId?: string;
  _isManual?: boolean;
}


export type ReviewStatus =
  | "OK"
  | "LESS"
  | "OVER"
  | "UOM_MISMATCH";


export interface BaseItemInfo {
  item_id: string;
  item_code: string;
  item_name: string;
  uom: string;
}

export interface ReviewSuggestionDetail extends BaseItemInfo {
  week_number: number;

  // qty contribution
  picked_qty: number;

  // location (DISPLAY FRIENDLY)
  source_zone: string;
  source_bin: string;

  // optional detail validation (jika mau highlight per-row)
  status?: ReviewStatus;
}

export interface ReviewGroup extends BaseItemInfo {
  // qty summary
  required_qty: number;
  already_picked_qty: number;
  remaining_qty: number;

  total_picked_qty: number;

  // final validation result
  status: ReviewStatus;

  // detail breakdown
  details: ReviewSuggestionDetail[];
}

export interface RawSuggestion {
  item_id: string;
  item_code: string;
  item_name: string;

  memo_id: string;

  uom: string;
  week_number: number;
  picked_qty: number;

  source_warehouse_sub_id: string;
  source_bin_id?: string;

  required_qty: number;
  already_picked_qty: number;
}

export interface RawSuggestionReview {
  item_id: string;
  item_code: string;
  item_name: string;

  uom: string;
  week_number: number;
  picked_qty: number;

  required_qty: number;
  already_picked_qty: number;

  // DISPLAY ONLY
  source_zone: string;
  source_bin: string;
}

export interface PickingPayloadItem {
  do_id: string | null;
  memo_id: string;
  item_id: string;

  source_warehouse_sub_id: string;
  source_bin_id?: string;

  destination_warehouse_sub_id: string;
  destination_bin_id: string;

  quantity: number;
  uom: string;
  week_number: number;

  status: "PENDING";
}

export interface PickingPayload {
  data: PickingPayloadItem[];
}


