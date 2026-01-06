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

export interface ReviewSuggestionRow {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  week_number: number;
  source_zone: string;
  source_bin: string;
}
